import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import User from '../../../../../models/User';
import Cohort from '../../../../../models/Cohort';
import { dataSyncMiddleware } from '../../../../../middleware/dataSyncMiddleware';
import mongoose from 'mongoose';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * Enhanced user management endpoint with comprehensive soft delete and synchronization
 */
export async function POST(request) {
  const session = await mongoose.startSession();
  
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession || authSession.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { action, userId, userIds, data } = await request.json();
    
    console.log(`🔄 Enhanced user management: ${action}`, { userId, userIds: userIds?.length, data });

    // Start transaction for data consistency
    session.startTransaction();
    
    let result = {};

    switch (action) {
      case 'reactivate_user':
        result = await reactivateUser(userId, data, authSession.user.gitlabUsername, session);
        break;
      
      case 'deactivate_user':
        result = await deactivateUser(userId, data, authSession.user.gitlabUsername, session);
        break;
      
      case 'update_user':
        result = await updateUser(userId, data, authSession.user.gitlabUsername, session);
        break;
      
      case 'bulk_reactivate':
        result = await bulkReactivateUsers(userIds, data, authSession.user.gitlabUsername, session);
        break;
      
      case 'bulk_deactivate':
        result = await bulkDeactivateUsers(userIds, data, authSession.user.gitlabUsername, session);
        break;
      
      case 'bulk_update':
        result = await bulkUpdateUsers(userIds, data, authSession.user.gitlabUsername, session);
        break;
      
      case 'assign_cohort':
        result = await assignUserToCohort(userId, data.cohortId, authSession.user.gitlabUsername, session);
        break;
      
      case 'remove_cohort':
        result = await removeUserFromCohort(userId, authSession.user.gitlabUsername, session);
        break;
      
      case 'bulk_assign_cohort':
        result = await bulkAssignCohort(userIds, data.cohortId, authSession.user.gitlabUsername, session);
        break;
      
      case 'bulk_remove_cohort':
        result = await bulkRemoveCohort(userIds, authSession.user.gitlabUsername, session);
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    await session.commitTransaction();
    
    console.log(`✅ Enhanced user management completed: ${action}`);
    
    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date()
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Enhanced user management error:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'User management operation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      action: action || 'unknown'
    }, { status: 500 });
  } finally {
    session.endSession();
  }
}

/**
 * Reactivate a user with conflict checking
 */
async function reactivateUser(userId, data, adminUsername, session) {
  console.log(`🔄 Reactivating user ${userId}...`);
  
  const user = await User.findById(userId).session(session);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.isActive) {
    return {
      user,
      message: 'User is already active',
      skipped: true
    };
  }

  // Check for conflicts
  const conflicts = await User.find({
    $or: [
      { gitlabUsername: user.gitlabUsername },
      { email: user.email }
    ],
    _id: { $ne: userId },
    isActive: true
  }).session(session);

  if (conflicts.length > 0) {
    const conflictDetails = conflicts.map(c => 
      `${c.gitlabUsername} (${c.email})`
    ).join(', ');
    throw new Error(`Cannot reactivate: Conflicts with active users: ${conflictDetails}`);
  }

  // Reactivate user
  await user.reactivate(data.reason || 'Admin action', adminUsername);

  console.log(`✅ User ${user.gitlabUsername} reactivated successfully`);

  return {
    user: await User.findById(userId).populate(['college', 'cohortId']).session(session),
    message: 'User reactivated successfully',
    conflicts: []
  };
}

/**
 * Deactivate a user (soft delete)
 */
async function deactivateUser(userId, data, adminUsername, session) {
  console.log(`🔄 Deactivating user ${userId}...`);
  
  const user = await User.findById(userId).session(session);
  if (!user) {
    throw new Error('User not found');
  }

  if (!user.isActive) {
    return {
      user,
      message: 'User is already inactive',
      skipped: true
    };
  }

  // Soft delete user
  await user.softDelete(data.reason || 'Admin action', adminUsername);

  console.log(`✅ User ${user.gitlabUsername} deactivated successfully`);

  return {
    user: await User.findById(userId).populate(['college', 'cohortId']).session(session),
    message: 'User deactivated successfully'
  };
}

/**
 * Update user with validation
 */
async function updateUser(userId, data, adminUsername, session) {
  console.log(`🔄 Updating user ${userId}...`);
  
  const user = await User.findById(userId).session(session);
  if (!user) {
    throw new Error('User not found');
  }

  const originalData = {
    isActive: user.isActive,
    cohortId: user.cohortId,
    role: user.role,
    college: user.college
  };

  // Handle activation/deactivation
  if (data.isActive !== undefined && data.isActive !== user.isActive) {
    if (data.isActive && !user.isActive) {
      // Reactivating - check for conflicts
      const conflicts = await User.find({
        $or: [
          { gitlabUsername: user.gitlabUsername },
          { email: user.email }
        ],
        _id: { $ne: userId },
        isActive: true
      }).session(session);

      if (conflicts.length > 0) {
        throw new Error('Cannot reactivate: GitLab username or email conflicts with active user');
      }

      await user.reactivate(data.reactivationReason || 'Admin update', adminUsername);
    } else if (!data.isActive && user.isActive) {
      await user.softDelete(data.deactivationReason || 'Admin update', adminUsername);
    }
  }

  // Handle cohort assignment
  if (data.cohortId !== undefined && String(data.cohortId) !== String(user.cohortId)) {
    if (data.cohortId && data.cohortId !== 'null') {
      // Validate cohort exists
      const cohort = await Cohort.findById(data.cohortId).session(session);
      if (!cohort) {
        throw new Error('Selected cohort not found');
      }
      await user.assignToCohort(data.cohortId, adminUsername);
    } else {
      await user.removeFromCohort(adminUsername);
    }
  }

  // Apply other updates
  const updateFields = ['name', 'email', 'gitlabUsername', 'role', 'college'];
  let hasChanges = false;

  updateFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== user[field]) {
      user[field] = data[field];
      hasChanges = true;
    }
  });

  if (hasChanges) {
    user.updatedAt = new Date();
    user.sessionVersion += 1; // Force session refresh
    await user.save({ session });
  }

  const updatedUser = await User.findById(userId).populate(['college', 'cohortId']).session(session);

  console.log(`✅ User ${updatedUser.gitlabUsername} updated successfully`);

  return {
    user: updatedUser,
    originalData,
    changes: Object.keys(data).filter(key => 
      originalData[key] !== undefined && String(originalData[key]) !== String(data[key])
    )
  };
}

/**
 * Bulk reactivate users
 */
async function bulkReactivateUsers(userIds, data, adminUsername, session) {
  console.log(`🔄 Bulk reactivating ${userIds.length} users...`);
  
  const results = {
    successful: [],
    failed: [],
    skipped: []
  };

  for (const userId of userIds) {
    try {
      const result = await reactivateUser(userId, data, adminUsername, session);
      
      if (result.skipped) {
        results.skipped.push({
          userId,
          username: result.user.gitlabUsername,
          reason: result.message
        });
      } else {
        results.successful.push({
          userId,
          username: result.user.gitlabUsername
        });
      }
    } catch (error) {
      results.failed.push({
        userId,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Bulk deactivate users
 */
async function bulkDeactivateUsers(userIds, data, adminUsername, session) {
  console.log(`🔄 Bulk deactivating ${userIds.length} users...`);
  
  const results = {
    successful: [],
    failed: [],
    skipped: []
  };

  for (const userId of userIds) {
    try {
      const result = await deactivateUser(userId, data, adminUsername, session);
      
      if (result.skipped) {
        results.skipped.push({
          userId,
          username: result.user.gitlabUsername,
          reason: result.message
        });
      } else {
        results.successful.push({
          userId,
          username: result.user.gitlabUsername
        });
      }
    } catch (error) {
      results.failed.push({
        userId,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Bulk update users
 */
async function bulkUpdateUsers(userIds, data, adminUsername, session) {
  console.log(`🔄 Bulk updating ${userIds.length} users...`);
  
  const results = await User.bulkUpdateWithValidation(userIds, data, adminUsername);
  
  return results;
}

/**
 * Assign user to cohort
 */
async function assignUserToCohort(userId, cohortId, adminUsername, session) {
  console.log(`🔄 Assigning user ${userId} to cohort ${cohortId}...`);
  
  const user = await User.findById(userId).session(session);
  if (!user) {
    throw new Error('User not found');
  }

  if (!user.isActive) {
    throw new Error('Cannot assign cohort to inactive user');
  }

  const cohort = await Cohort.findById(cohortId).session(session);
  if (!cohort) {
    throw new Error('Cohort not found');
  }

  if (user.cohortId && user.cohortId.toString() === cohortId) {
    return {
      user,
      message: `User is already assigned to cohort ${cohort.name}`,
      skipped: true
    };
  }

  await user.assignToCohort(cohortId, adminUsername);

  return {
    user: await User.findById(userId).populate(['college', 'cohortId']).session(session),
    message: `User assigned to cohort ${cohort.name}`
  };
}

/**
 * Remove user from cohort
 */
async function removeUserFromCohort(userId, adminUsername, session) {
  console.log(`🔄 Removing user ${userId} from cohort...`);
  
  const user = await User.findById(userId).populate('cohortId').session(session);
  if (!user) {
    throw new Error('User not found');
  }

  if (!user.cohortId) {
    return {
      user,
      message: 'User is not assigned to any cohort',
      skipped: true
    };
  }

  const cohortName = user.cohortId.name;
  await user.removeFromCohort(adminUsername);

  return {
    user: await User.findById(userId).populate(['college', 'cohortId']).session(session),
    message: `User removed from cohort ${cohortName}`
  };
}

/**
 * Bulk assign cohort
 */
async function bulkAssignCohort(userIds, cohortId, adminUsername, session) {
  console.log(`🔄 Bulk assigning ${userIds.length} users to cohort ${cohortId}...`);
  
  const results = await Cohort.assignUsers(cohortId, userIds, adminUsername);
  
  return results;
}

/**
 * Bulk remove from cohort
 */
async function bulkRemoveCohort(userIds, adminUsername, session) {
  console.log(`🔄 Bulk removing ${userIds.length} users from cohorts...`);
  
  const results = {
    successful: [],
    failed: [],
    skipped: []
  };

  for (const userId of userIds) {
    try {
      const result = await removeUserFromCohort(userId, adminUsername, session);
      
      if (result.skipped) {
        results.skipped.push({
          userId,
          username: result.user.gitlabUsername,
          reason: result.message
        });
      } else {
        results.successful.push({
          userId,
          username: result.user.gitlabUsername
        });
      }
    } catch (error) {
      results.failed.push({
        userId,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * GET endpoint for enhanced user data with sync status
 */
export async function GET(request) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession || authSession.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    const userId = url.searchParams.get('userId');
    
    if (userId) {
      // Get specific user with full details
      const user = await User.findById(userId)
        .populate(['college', 'cohortId'])
        .lean();
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      return NextResponse.json({ user });
    } else {
      // Get all users with enhanced data
      const query = includeInactive ? {} : { isActive: true };
      
      const users = await User.find(query)
        .populate(['college', 'cohortId'])
        .sort({ updatedAt: -1 })
        .lean();
      
      // Get sync status
      const syncStatus = dataSyncMiddleware.getSyncStatus();
      
      // Get statistics
      const stats = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
            inactiveUsers: { $sum: { $cond: ['$isActive', 0, 1] } },
            usersWithCohorts: { $sum: { $cond: [{ $ne: ['$cohortId', null] }, 1, 0] } },
            recentlyUpdated: {
              $sum: {
                $cond: [
                  { $gte: ['$updatedAt', new Date(Date.now() - 24 * 60 * 60 * 1000)] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);
      
      return NextResponse.json({
        users,
        syncStatus,
        statistics: stats[0] || {},
        timestamp: new Date()
      });
    }

  } catch (error) {
    console.error('Error fetching enhanced user data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user data',
      details: error.message 
    }, { status: 500 });
  }
}