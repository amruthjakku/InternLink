import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import { dataSyncMiddleware } from '../../../../../middleware/dataSyncMiddleware';
import User from '../../../../../models/User';
import Cohort from '../../../../../models/Cohort';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * Enhanced user synchronization endpoint
 * Ensures all changes are properly synchronized across database, backend, and frontend
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { action, userId, data } = await request.json();
    
    console.log(`🔄 User sync request: ${action} for user ${userId}`);
    console.log('Sync data:', data);

    let result = {};

    switch (action) {
      case 'update_user':
        result = await syncUserUpdate(userId, data, session.user.gitlabUsername);
        break;
      
      case 'activate_user':
        result = await syncUserActivation(userId, true, data.reason, session.user.gitlabUsername);
        break;
      
      case 'deactivate_user':
        result = await syncUserActivation(userId, false, data.reason, session.user.gitlabUsername);
        break;
      
      case 'assign_cohort':
        result = await syncCohortAssignment(userId, data.cohortId, 'assign');
        break;
      
      case 'remove_cohort':
        result = await syncCohortAssignment(userId, null, 'remove', data.originalCohortId);
        break;
      
      case 'bulk_update':
        result = await syncBulkUpdate(data.userIds, data.updateData, session.user.gitlabUsername);
        break;
      
      default:
        return NextResponse.json({ 
          error: `Unknown sync action: ${action}` 
        }, { status: 400 });
    }

    console.log(`✅ Sync completed: ${action}`);
    
    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ User sync error:', error);
    return NextResponse.json({ 
      error: 'User sync failed',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Sync user update with comprehensive validation
 */
async function syncUserUpdate(userId, data, adminUsername) {
  console.log(`🔄 Syncing user update for ${userId}...`);
  
  // Get current user data
  const currentUser = await User.findById(userId).populate(['college', 'cohortId']);
  if (!currentUser) {
    throw new Error('User not found');
  }

  const originalData = {
    isActive: currentUser.isActive,
    cohortId: currentUser.cohortId?._id,
    role: currentUser.role,
    college: currentUser.college?._id
  };

  // Validate cohort if provided
  if (data.cohortId && data.cohortId !== 'null' && data.cohortId !== '') {
    const cohort = await Cohort.findById(data.cohortId);
    if (!cohort) {
      throw new Error('Selected cohort not found');
    }
  }

  // Prepare update data
  const updateData = {
    ...data,
    updatedAt: new Date()
  };

  // Handle cohort assignment
  if (data.cohortId !== undefined) {
    updateData.cohortId = data.cohortId === 'null' || data.cohortId === '' ? null : data.cohortId;
  }

  // Handle activation/deactivation
  if (data.isActive !== undefined && data.isActive !== currentUser.isActive) {
    updateData.lastTokenRefresh = new Date();
    
    if (data.isActive && !currentUser.isActive) {
      // Reactivating user
      updateData.reactivatedAt = new Date();
      updateData.reactivationReason = data.reactivationReason || 'Admin update';
      updateData.reactivatedBy = adminUsername;
      updateData.deactivatedAt = null;
      updateData.deactivationReason = null;
      updateData.deactivatedBy = null;
    } else if (!data.isActive && currentUser.isActive) {
      // Deactivating user
      updateData.deactivatedAt = new Date();
      updateData.deactivationReason = data.deactivationReason || 'Admin update';
      updateData.deactivatedBy = adminUsername;
    }
  }

  // Apply update
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  ).populate(['college', 'cohortId']);

  // Queue cohort member count updates
  const cohortsToUpdate = new Set();
  if (originalData.cohortId) cohortsToUpdate.add(String(originalData.cohortId));
  if (updatedUser.cohortId) cohortsToUpdate.add(String(updatedUser.cohortId));

  for (const cohortId of cohortsToUpdate) {
    dataSyncMiddleware.queueSync({
      type: 'cohort_member_count',
      id: cohortId,
      cohortId
    });
  }

  // Log changes
  const changes = [];
  if (originalData.isActive !== updatedUser.isActive) {
    changes.push(`Status: ${originalData.isActive ? 'Active' : 'Inactive'} → ${updatedUser.isActive ? 'Active' : 'Inactive'}`);
  }
  if (originalData.role !== updatedUser.role) {
    changes.push(`Role: ${originalData.role} → ${updatedUser.role}`);
  }
  if (String(originalData.cohortId) !== String(updatedUser.cohortId?._id)) {
    const oldCohort = originalData.cohortId ? 'Assigned' : 'None';
    const newCohort = updatedUser.cohortId ? updatedUser.cohortId.name : 'None';
    changes.push(`Cohort: ${oldCohort} → ${newCohort}`);
  }

  console.log(`✅ User ${updatedUser.gitlabUsername} updated: ${changes.join(', ') || 'Basic info updated'}`);

  return {
    user: updatedUser,
    changes,
    originalData,
    syncQueued: cohortsToUpdate.size > 0
  };
}

/**
 * Sync user activation/deactivation
 */
async function syncUserActivation(userId, isActive, reason, adminUsername) {
  console.log(`🔄 Syncing user ${isActive ? 'activation' : 'deactivation'} for ${userId}...`);
  
  const user = await User.findById(userId).populate(['college', 'cohortId']);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.isActive === isActive) {
    return {
      user,
      message: `User is already ${isActive ? 'active' : 'inactive'}`,
      skipped: true
    };
  }

  // Check for conflicts when reactivating
  if (isActive && !user.isActive) {
    const conflicts = await User.find({
      $or: [
        { gitlabUsername: user.gitlabUsername },
        { email: user.email }
      ],
      _id: { $ne: userId },
      isActive: true
    });

    if (conflicts.length > 0) {
      throw new Error('Cannot reactivate: GitLab username or email is already in use by another active user');
    }
  }

  // Queue sync operation
  dataSyncMiddleware.queueSync({
    type: 'user_activation',
    id: userId,
    userId,
    isActive,
    reason,
    adminUsername
  });

  console.log(`✅ User ${isActive ? 'activation' : 'deactivation'} queued for ${user.gitlabUsername}`);

  return {
    user,
    action: isActive ? 'activation' : 'deactivation',
    queued: true,
    reason
  };
}

/**
 * Sync cohort assignment
 */
async function syncCohortAssignment(userId, cohortId, action, originalCohortId = null) {
  console.log(`🔄 Syncing cohort ${action} for user ${userId}...`);
  
  const user = await User.findById(userId).populate('cohortId');
  if (!user) {
    throw new Error('User not found');
  }

  if (!user.isActive) {
    throw new Error('Cannot assign cohort to inactive user');
  }

  // Validate cohort if assigning
  if (action === 'assign' && cohortId) {
    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      throw new Error('Cohort not found');
    }

    // Check if already assigned
    const currentCohortId = typeof user.cohortId === 'string' 
      ? user.cohortId 
      : user.cohortId._id.toString();
    if (user.cohortId && currentCohortId === cohortId) {
      return {
        user,
        message: `User is already assigned to cohort ${cohort.name}`,
        skipped: true
      };
    }
  }

  // Get original cohort ID if not provided
  if (!originalCohortId && user.cohortId) {
    originalCohortId = typeof user.cohortId === 'string' 
      ? user.cohortId 
      : user.cohortId._id.toString();
  }

  // Queue sync operation
  dataSyncMiddleware.queueSync({
    type: 'cohort_assignment',
    id: userId,
    userId,
    cohortId,
    action,
    originalCohortId
  });

  console.log(`✅ Cohort ${action} queued for user ${user.gitlabUsername}`);

  return {
    user,
    action,
    cohortId,
    originalCohortId,
    queued: true
  };
}

/**
 * Sync bulk update operations
 */
async function syncBulkUpdate(userIds, updateData, adminUsername) {
  console.log(`🔄 Syncing bulk update for ${userIds.length} users...`);
  
  const results = {
    queued: [],
    failed: [],
    skipped: []
  };

  for (const userId of userIds) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        results.failed.push({
          userId,
          error: 'User not found'
        });
        continue;
      }

      // Queue individual sync operations
      dataSyncMiddleware.queueSync({
        type: 'user_update',
        id: userId,
        data: {
          ...updateData,
          updatedBy: adminUsername
        },
        originalData: {
          isActive: user.isActive,
          cohortId: user.cohortId,
          role: user.role
        }
      });

      results.queued.push({
        userId,
        username: user.gitlabUsername
      });

    } catch (error) {
      results.failed.push({
        userId,
        error: error.message
      });
    }
  }

  console.log(`✅ Bulk update queued: ${results.queued.length} operations`);

  return results;
}

/**
 * GET endpoint for sync status
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const syncStatus = dataSyncMiddleware.getSyncStatus();
    
    return NextResponse.json({
      syncStatus,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch sync status',
      details: error.message 
    }, { status: 500 });
  }
}