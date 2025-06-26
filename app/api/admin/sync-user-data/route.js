import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import Cohort from '../../../../models/Cohort';
import College from '../../../../models/College';
import mongoose from 'mongoose';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * Comprehensive user data synchronization endpoint
 * Ensures database, backend, and frontend are all in sync
 */
export async function POST(request) {
  const session = await mongoose.startSession();
  
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession || authSession.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { action, userId, data } = await request.json();
    
    console.log(`🔄 User data sync request: ${action} for user ${userId}`);

    // Start transaction for data consistency
    session.startTransaction();
    
    let result = {};

    switch (action) {
      case 'full_sync':
        result = await performFullSync(session);
        break;
      
      case 'sync_user':
        result = await syncSingleUser(userId, data, session);
        break;
      
      case 'sync_cohort_assignments':
        result = await syncCohortAssignments(session);
        break;
      
      case 'fix_inactive_users':
        result = await fixInactiveUsers(session);
        break;
      
      case 'validate_data_integrity':
        result = await validateDataIntegrity(session);
        break;
      
      default:
        throw new Error(`Unknown sync action: ${action}`);
    }

    await session.commitTransaction();
    
    console.log(`✅ Sync completed: ${action}`);
    
    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date()
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Sync error:', error);
    return NextResponse.json({ 
      error: 'Sync operation failed',
      details: error.message 
    }, { status: 500 });
  } finally {
    session.endSession();
  }
}

/**
 * Perform full system synchronization
 */
async function performFullSync(session) {
  console.log('🔄 Starting full system sync...');
  
  const results = {
    usersProcessed: 0,
    cohortsUpdated: 0,
    inconsistenciesFixed: 0,
    errors: []
  };

  try {
    // 1. Fix user-cohort relationships
    const users = await User.find({}).populate('cohortId').session(session);
    
    for (const user of users) {
      try {
        let needsUpdate = false;
        const updateData = {};

        // Check cohort assignment consistency
        if (user.cohortId) {
          const cohort = await Cohort.findById(user.cohortId).session(session);
          if (!cohort) {
            console.log(`⚠️ User ${user.gitlabUsername} assigned to non-existent cohort ${user.cohortId}`);
            updateData.cohortId = null;
            needsUpdate = true;
            results.inconsistenciesFixed++;
          }
        }

        // Ensure updatedAt is set
        if (!user.updatedAt) {
          updateData.updatedAt = new Date();
          needsUpdate = true;
        }

        // Force token refresh for inactive users being reactivated
        if (!user.isActive && user.reactivatedAt && !user.lastTokenRefresh) {
          updateData.lastTokenRefresh = new Date();
          needsUpdate = true;
        }

        if (needsUpdate) {
          await User.findByIdAndUpdate(user._id, updateData, { session });
          console.log(`✅ Fixed user ${user.gitlabUsername}`);
        }

        results.usersProcessed++;
      } catch (error) {
        console.error(`❌ Error processing user ${user.gitlabUsername}:`, error);
        results.errors.push(`User ${user.gitlabUsername}: ${error.message}`);
      }
    }

    // 2. Update cohort member counts
    const cohorts = await Cohort.find({}).session(session);
    
    for (const cohort of cohorts) {
      try {
        const memberCount = await User.countDocuments({
          cohortId: cohort._id,
          isActive: true
        }).session(session);

        if (cohort.memberCount !== memberCount) {
          await Cohort.findByIdAndUpdate(
            cohort._id,
            { 
              memberCount,
              updatedAt: new Date()
            },
            { session }
          );
          console.log(`✅ Updated cohort ${cohort.name} member count: ${memberCount}`);
          results.cohortsUpdated++;
        }
      } catch (error) {
        console.error(`❌ Error updating cohort ${cohort.name}:`, error);
        results.errors.push(`Cohort ${cohort.name}: ${error.message}`);
      }
    }

    console.log(`✅ Full sync completed: ${results.usersProcessed} users, ${results.cohortsUpdated} cohorts updated, ${results.inconsistenciesFixed} fixes`);
    
    return results;
  } catch (error) {
    console.error('❌ Full sync error:', error);
    throw error;
  }
}

/**
 * Sync a single user's data
 */
async function syncSingleUser(userId, data, session) {
  console.log(`🔄 Syncing user ${userId}...`);
  
  const user = await User.findById(userId).session(session);
  if (!user) {
    throw new Error('User not found');
  }

  const originalData = {
    isActive: user.isActive,
    cohortId: user.cohortId,
    role: user.role
  };

  // Apply updates with validation
  const updateData = {
    ...data,
    updatedAt: new Date()
  };

  // Handle activation/deactivation
  if (data.isActive !== undefined && data.isActive !== user.isActive) {
    updateData.lastTokenRefresh = new Date();
    
    if (data.isActive && !user.isActive) {
      // Reactivating user
      updateData.reactivatedAt = new Date();
      updateData.reactivationReason = data.reactivationReason || 'Admin sync';
      updateData.reactivatedBy = data.reactivatedBy || 'system';
      updateData.deactivatedAt = null;
      updateData.deactivationReason = null;
      updateData.deactivatedBy = null;
    } else if (!data.isActive && user.isActive) {
      // Deactivating user
      updateData.deactivatedAt = new Date();
      updateData.deactivationReason = data.deactivationReason || 'Admin sync';
      updateData.deactivatedBy = data.deactivatedBy || 'system';
    }
  }

  // Handle cohort assignment
  if (data.cohortId !== undefined && String(data.cohortId) !== String(user.cohortId)) {
    if (data.cohortId) {
      // Validate cohort exists
      const cohort = await Cohort.findById(data.cohortId).session(session);
      if (!cohort) {
        throw new Error('Cohort not found');
      }
    }
    updateData.cohortId = data.cohortId || null;
  }

  // Apply updates
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateData,
    { 
      new: true, 
      session,
      runValidators: true 
    }
  ).populate(['college', 'cohortId']);

  // Update related cohort statistics
  const cohortsToUpdate = new Set();
  if (originalData.cohortId) cohortsToUpdate.add(String(originalData.cohortId));
  if (updatedUser.cohortId) cohortsToUpdate.add(String(updatedUser.cohortId));

  for (const cohortId of cohortsToUpdate) {
    const memberCount = await User.countDocuments({
      cohortId: cohortId,
      isActive: true
    }).session(session);

    await Cohort.findByIdAndUpdate(
      cohortId,
      { 
        memberCount,
        updatedAt: new Date()
      },
      { session }
    );
  }

  console.log(`✅ User ${updatedUser.gitlabUsername} synced successfully`);

  return {
    user: updatedUser,
    changes: {
      from: originalData,
      to: {
        isActive: updatedUser.isActive,
        cohortId: updatedUser.cohortId,
        role: updatedUser.role
      }
    }
  };
}

/**
 * Sync all cohort assignments
 */
async function syncCohortAssignments(session) {
  console.log('🔄 Syncing cohort assignments...');
  
  const results = {
    cohortsProcessed: 0,
    assignmentsFixed: 0,
    errors: []
  };

  const cohorts = await Cohort.find({}).session(session);
  
  for (const cohort of cohorts) {
    try {
      // Count actual members
      const actualMembers = await User.countDocuments({
        cohortId: cohort._id,
        isActive: true
      }).session(session);

      // Update if different
      if (cohort.memberCount !== actualMembers) {
        await Cohort.findByIdAndUpdate(
          cohort._id,
          { 
            memberCount: actualMembers,
            updatedAt: new Date()
          },
          { session }
        );
        
        console.log(`✅ Fixed cohort ${cohort.name}: ${cohort.memberCount} → ${actualMembers} members`);
        results.assignmentsFixed++;
      }

      results.cohortsProcessed++;
    } catch (error) {
      console.error(`❌ Error syncing cohort ${cohort.name}:`, error);
      results.errors.push(`Cohort ${cohort.name}: ${error.message}`);
    }
  }

  return results;
}

/**
 * Fix inactive users with inconsistent data
 */
async function fixInactiveUsers(session) {
  console.log('🔄 Fixing inactive users...');
  
  const results = {
    usersFixed: 0,
    errors: []
  };

  // Find inactive users with missing deactivation data
  const inactiveUsers = await User.find({
    isActive: false,
    $or: [
      { deactivatedAt: null },
      { deactivatedAt: { $exists: false } }
    ]
  }).session(session);

  for (const user of inactiveUsers) {
    try {
      await User.findByIdAndUpdate(
        user._id,
        {
          deactivatedAt: user.updatedAt || new Date(),
          deactivationReason: 'System cleanup',
          deactivatedBy: 'system',
          lastTokenRefresh: new Date(),
          updatedAt: new Date()
        },
        { session }
      );

      console.log(`✅ Fixed inactive user ${user.gitlabUsername}`);
      results.usersFixed++;
    } catch (error) {
      console.error(`❌ Error fixing user ${user.gitlabUsername}:`, error);
      results.errors.push(`User ${user.gitlabUsername}: ${error.message}`);
    }
  }

  return results;
}

/**
 * Validate data integrity
 */
async function validateDataIntegrity(session) {
  console.log('🔍 Validating data integrity...');
  
  const issues = [];

  // Check for users with invalid cohort references
  const usersWithInvalidCohorts = await User.aggregate([
    {
      $match: {
        cohortId: { $ne: null }
      }
    },
    {
      $lookup: {
        from: 'cohorts',
        localField: 'cohortId',
        foreignField: '_id',
        as: 'cohort'
      }
    },
    {
      $match: {
        cohort: { $size: 0 }
      }
    },
    {
      $project: {
        gitlabUsername: 1,
        name: 1,
        cohortId: 1
      }
    }
  ]).session(session);

  if (usersWithInvalidCohorts.length > 0) {
    issues.push({
      type: 'invalid_cohort_references',
      count: usersWithInvalidCohorts.length,
      users: usersWithInvalidCohorts
    });
  }

  // Check for cohorts with incorrect member counts
  const cohortsWithWrongCounts = await Cohort.aggregate([
    {
      $lookup: {
        from: 'users',
        let: { cohortId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$cohortId', '$$cohortId'] },
                  { $eq: ['$isActive', true] }
                ]
              }
            }
          },
          { $count: 'count' }
        ],
        as: 'actualMembers'
      }
    },
    {
      $addFields: {
        actualCount: { $ifNull: [{ $arrayElemAt: ['$actualMembers.count', 0] }, 0] }
      }
    },
    {
      $match: {
        $expr: { $ne: ['$memberCount', '$actualCount'] }
      }
    },
    {
      $project: {
        name: 1,
        memberCount: 1,
        actualCount: 1
      }
    }
  ]).session(session);

  if (cohortsWithWrongCounts.length > 0) {
    issues.push({
      type: 'incorrect_member_counts',
      count: cohortsWithWrongCounts.length,
      cohorts: cohortsWithWrongCounts
    });
  }

  return {
    valid: issues.length === 0,
    issues,
    summary: `Found ${issues.length} integrity issues`
  };
}

/**
 * GET endpoint for sync status and statistics
 */
export async function GET(request) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession || authSession.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get sync statistics
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactiveUsers: { $sum: { $cond: ['$isActive', 0, 1] } },
          usersWithCohorts: { $sum: { $cond: [{ $ne: ['$cohortId', null] }, 1, 0] } },
          usersWithoutCohorts: { $sum: { $cond: [{ $eq: ['$cohortId', null] }, 1, 0] } },
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

    const cohortStats = await Cohort.aggregate([
      {
        $group: {
          _id: null,
          totalCohorts: { $sum: 1 },
          totalMemberCount: { $sum: '$memberCount' }
        }
      }
    ]);

    return NextResponse.json({
      userStats: stats[0] || {},
      cohortStats: cohortStats[0] || {},
      lastSyncCheck: new Date()
    });

  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch sync status',
      details: error.message 
    }, { status: 500 });
  }
}