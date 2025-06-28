import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import User from '../../../../../models/User';
import Cohort from '../../../../../models/Cohort';
import mongoose from 'mongoose';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * Enhanced cohort assignment endpoint with comprehensive validation and synchronization
 */
export async function POST(request) {
  const session = await mongoose.startSession();
  
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession || authSession.user.role !== 'admin') {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    await connectToDatabase();
    
    const requestBody = await request.json();
    const { cohortId, userIds, action = 'assign' } = requestBody;
    
    console.log(`🎯 Cohort ${action} request received:`, {
      cohortId,
      userIds: userIds?.length ? `${userIds.length} users` : 'No users',
      action,
      adminUser: authSession.user.gitlabUsername
    });
    
    // Log the actual user IDs for debugging
    if (userIds && userIds.length > 0) {
      console.log('User IDs to process:', userIds);
    }

    // Validate input
    if (!cohortId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      console.log('❌ Invalid input:', { cohortId, userIds });
      return NextResponse.json({ 
        error: 'Missing required data: cohortId and userIds array are required',
        details: `cohortId: ${cohortId ? 'provided' : 'missing'}, userIds: ${Array.isArray(userIds) ? `${userIds.length} items` : 'invalid'}`
      }, { status: 400 });
    }

    // Start transaction
    session.startTransaction();
    console.log('🔄 Database transaction started');
    
    // Validate cohort exists
    const cohort = await Cohort.findById(cohortId).session(session);
    if (!cohort) {
      console.log(`❌ Cohort not found: ${cohortId}`);
      return NextResponse.json({ 
        error: 'Cohort not found',
        details: `No cohort found with ID: ${cohortId}`
      }, { status: 404 });
    }

    console.log(`✅ Cohort validated: "${cohort.name}" (${cohort._id})`);

    const results = {
      success: [],
      failed: [],
      skipped: [],
      totalProcessed: 0
    };

    // Process each user
    for (const userId of userIds) {
      try {
        results.totalProcessed++;
        
        // Find user
        const user = await User.findById(userId).session(session);
        if (!user) {
          results.failed.push({
            userId,
            error: 'User not found',
            username: 'unknown'
          });
          continue;
        }

        // Check if user is active
        if (!user.isActive) {
          results.failed.push({
            userId,
            username: user.gitlabUsername,
            error: 'User is not active'
          });
          continue;
        }

        const originalCohortId = user.cohortId;
        let updateData = { updatedAt: new Date() };
        let logMessage = `User ${user.gitlabUsername} (${user.name})`;

        if (action === 'assign') {
          // Check if already assigned to this cohort
          if (user.cohortId && user.cohortId.toString() === cohortId) {
            results.skipped.push({
              userId,
              username: user.gitlabUsername,
              reason: `Already assigned to cohort ${cohort.name}`
            });
            continue;
          }

          updateData.cohortId = cohortId;
          logMessage += ` - ASSIGNED TO COHORT: ${cohort.name}`;
          
          // If user was in another cohort, log the change
          if (originalCohortId) {
            const oldCohort = await Cohort.findById(originalCohortId).session(session);
            logMessage += ` (moved from ${oldCohort?.name || 'unknown cohort'})`;
          }

        } else if (action === 'remove') {
          // Check if user has a cohort to remove
          if (!user.cohortId) {
            results.skipped.push({
              userId,
              username: user.gitlabUsername,
              reason: 'User is not assigned to any cohort'
            });
            continue;
          }

          // Check if user is assigned to the specified cohort
          if (user.cohortId.toString() !== cohortId) {
            results.failed.push({
              userId,
              username: user.gitlabUsername,
              error: 'User is not assigned to the specified cohort'
            });
            continue;
          }

          updateData.cohortId = null;
          logMessage += ` - REMOVED FROM COHORT: ${cohort.name}`;

        } else {
          results.failed.push({
            userId,
            username: user.gitlabUsername,
            error: `Unknown action: ${action}`
          });
          continue;
        }

        // Apply the update
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          updateData,
          { 
            new: true, 
            session,
            runValidators: true 
          }
        ).populate('cohortId');

        console.log(`✅ ${logMessage}`);

        results.success.push({
          userId,
          username: updatedUser.gitlabUsername,
          name: updatedUser.name,
          cohortChange: {
            from: originalCohortId,
            to: updatedUser.cohortId,
            cohortName: updatedUser.cohortId?.name || null
          },
          message: logMessage
        });

      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error);
        results.failed.push({
          userId,
          username: 'unknown',
          error: error.message
        });
      }
    }

    // Update cohort statistics
    if (results.success.length > 0) {
      try {
        // Count current members
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

        console.log(`📊 Updated cohort ${cohort.name} member count: ${memberCount}`);
      } catch (error) {
        console.warn(`⚠️ Failed to update cohort statistics:`, error);
      }
    }

    // Commit transaction if we have any successful updates
    if (results.success.length > 0) {
      await session.commitTransaction();
      console.log(`✅ Cohort ${action} completed: ${results.success.length} successful, ${results.failed.length} failed, ${results.skipped.length} skipped`);
    } else {
      await session.abortTransaction();
      console.log(`⚠️ No cohort assignments applied: ${results.failed.length} failed, ${results.skipped.length} skipped`);
    }

    return NextResponse.json({
      success: true,
      action,
      cohort: {
        id: cohort._id,
        name: cohort.name
      },
      results,
      summary: {
        total: results.totalProcessed,
        successful: results.success.length,
        failed: results.failed.length,
        skipped: results.skipped.length
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Cohort assignment error:', error);
    return NextResponse.json({ 
      error: 'Cohort assignment failed',
      details: error.message 
    }, { status: 500 });
  } finally {
    session.endSession();
  }
}

/**
 * Get cohort assignment status and statistics
 */
export async function GET(request) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession || authSession.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const cohortId = searchParams.get('cohortId');

    if (cohortId) {
      // Get specific cohort assignment details
      const cohort = await Cohort.findById(cohortId);
      if (!cohort) {
        return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
      }

      const members = await User.find({
        cohortId: cohortId,
        isActive: true
      }).select('gitlabUsername name email role college createdAt updatedAt')
        .populate('college', 'name')
        .sort({ name: 1 });

      const inactiveMembers = await User.find({
        cohortId: cohortId,
        isActive: false
      }).select('gitlabUsername name email role deactivatedAt deactivationReason')
        .sort({ deactivatedAt: -1 });

      return NextResponse.json({
        cohort: {
          id: cohort._id,
          name: cohort.name,
          description: cohort.description,
          memberCount: members.length,
          inactiveMemberCount: inactiveMembers.length
        },
        members,
        inactiveMembers
      });
    } else {
      // Get overall cohort assignment statistics
      const stats = await User.aggregate([
        {
          $group: {
            _id: '$cohortId',
            count: { $sum: 1 },
            activeCount: { $sum: { $cond: ['$isActive', 1, 0] } },
            inactiveCount: { $sum: { $cond: ['$isActive', 0, 1] } }
          }
        },
        {
          $lookup: {
            from: 'cohorts',
            localField: '_id',
            foreignField: '_id',
            as: 'cohort'
          }
        },
        {
          $unwind: {
            path: '$cohort',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            cohortId: '$_id',
            cohortName: '$cohort.name',
            totalMembers: '$count',
            activeMembers: '$activeCount',
            inactiveMembers: '$inactiveCount'
          }
        },
        {
          $sort: { cohortName: 1 }
        }
      ]);

      // Count users without cohorts
      const usersWithoutCohort = await User.countDocuments({
        cohortId: null,
        isActive: true
      });

      const inactiveUsersWithoutCohort = await User.countDocuments({
        cohortId: null,
        isActive: false
      });

      return NextResponse.json({
        cohortStats: stats,
        usersWithoutCohort: {
          active: usersWithoutCohort,
          inactive: inactiveUsersWithoutCohort,
          total: usersWithoutCohort + inactiveUsersWithoutCohort
        },
        summary: {
          totalCohorts: stats.filter(s => s.cohortId !== null).length,
          totalAssignedUsers: stats.reduce((sum, s) => sum + (s.cohortId ? s.totalMembers : 0), 0),
          totalUnassignedUsers: usersWithoutCohort + inactiveUsersWithoutCohort
        }
      });
    }

  } catch (error) {
    console.error('Error fetching cohort assignment status:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch cohort assignment status',
      details: error.message 
    }, { status: 500 });
  }
}