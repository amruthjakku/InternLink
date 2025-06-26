import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import User from '../../../../../models/User';
import College from '../../../../../models/College';
import Cohort from '../../../../../models/Cohort';
import mongoose from 'mongoose';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * Enhanced bulk user update endpoint with comprehensive validation and logging
 */
export async function POST(request) {
  const session = await mongoose.startSession();
  
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession || authSession.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { action, userIds, updateData } = await request.json();
    
    console.log(`🔄 Bulk update request: ${action} for ${userIds?.length || 0} users`);
    console.log('Update data:', updateData);

    // Validate input
    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid request: action and userIds array are required' 
      }, { status: 400 });
    }

    // Start transaction
    session.startTransaction();
    
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
        
        // Find user with current data
        const user = await User.findById(userId).session(session);
        if (!user) {
          results.failed.push({
            userId,
            error: 'User not found',
            username: 'unknown'
          });
          continue;
        }

        const originalData = {
          isActive: user.isActive,
          role: user.role,
          cohortId: user.cohortId,
          college: user.college
        };

        let updateFields = { updatedAt: new Date() };
        let logMessage = `User ${user.gitlabUsername} (${user.name})`;

        // Handle different actions
        switch (action) {
          case 'activate':
            if (user.isActive) {
              results.skipped.push({
                userId,
                username: user.gitlabUsername,
                reason: 'Already active'
              });
              continue;
            }
            updateFields.isActive = true;
            updateFields.lastTokenRefresh = new Date(); // Force session refresh
            logMessage += ' - ACTIVATED';
            break;

          case 'deactivate':
            if (!user.isActive) {
              results.skipped.push({
                userId,
                username: user.gitlabUsername,
                reason: 'Already inactive'
              });
              continue;
            }
            updateFields.isActive = false;
            updateFields.lastTokenRefresh = new Date(); // Force session refresh
            logMessage += ' - DEACTIVATED';
            break;

          case 'assign_cohort':
            if (!updateData?.cohortId) {
              results.failed.push({
                userId,
                username: user.gitlabUsername,
                error: 'Cohort ID required for assignment'
              });
              continue;
            }

            // Validate cohort exists
            const cohort = await Cohort.findById(updateData.cohortId).session(session);
            if (!cohort) {
              results.failed.push({
                userId,
                username: user.gitlabUsername,
                error: 'Cohort not found'
              });
              continue;
            }

            // Check if already assigned to this cohort
            if (user.cohortId && user.cohortId.toString() === updateData.cohortId) {
              results.skipped.push({
                userId,
                username: user.gitlabUsername,
                reason: `Already assigned to cohort ${cohort.name}`
              });
              continue;
            }

            updateFields.cohortId = updateData.cohortId;
            logMessage += ` - ASSIGNED TO COHORT: ${cohort.name}`;
            break;

          case 'remove_cohort':
            if (!user.cohortId) {
              results.skipped.push({
                userId,
                username: user.gitlabUsername,
                reason: 'No cohort assigned'
              });
              continue;
            }
            updateFields.cohortId = null;
            logMessage += ' - REMOVED FROM COHORT';
            break;

          case 'change_role':
            if (!updateData?.role) {
              results.failed.push({
                userId,
                username: user.gitlabUsername,
                error: 'Role required for role change'
              });
              continue;
            }

            if (user.role === updateData.role) {
              results.skipped.push({
                userId,
                username: user.gitlabUsername,
                reason: `Already has role ${updateData.role}`
              });
              continue;
            }

            updateFields.role = updateData.role;
            updateFields.lastTokenRefresh = new Date(); // Force session refresh for role changes
            logMessage += ` - ROLE CHANGED: ${user.role} → ${updateData.role}`;
            break;

          case 'update_college':
            if (!updateData?.collegeId) {
              results.failed.push({
                userId,
                username: user.gitlabUsername,
                error: 'College ID required for college update'
              });
              continue;
            }

            // Validate college exists
            const college = await College.findById(updateData.collegeId).session(session);
            if (!college) {
              results.failed.push({
                userId,
                username: user.gitlabUsername,
                error: 'College not found'
              });
              continue;
            }

            updateFields.college = updateData.collegeId;
            logMessage += ` - COLLEGE UPDATED: ${college.name}`;
            break;

          default:
            results.failed.push({
              userId,
              username: user.gitlabUsername,
              error: `Unknown action: ${action}`
            });
            continue;
        }

        // Apply updates
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          updateFields,
          { 
            new: true, 
            session,
            runValidators: true 
          }
        ).populate(['college', 'cohortId']);

        console.log(`✅ ${logMessage}`);

        results.success.push({
          userId,
          username: updatedUser.gitlabUsername,
          name: updatedUser.name,
          changes: {
            before: originalData,
            after: {
              isActive: updatedUser.isActive,
              role: updatedUser.role,
              cohortId: updatedUser.cohortId,
              college: updatedUser.college
            }
          },
          message: logMessage
        });

      } catch (error) {
        console.error(`❌ Error updating user ${userId}:`, error);
        results.failed.push({
          userId,
          username: 'unknown',
          error: error.message
        });
      }
    }

    // Commit transaction if we have any successful updates
    if (results.success.length > 0) {
      await session.commitTransaction();
      console.log(`✅ Bulk update completed: ${results.success.length} successful, ${results.failed.length} failed, ${results.skipped.length} skipped`);
    } else {
      await session.abortTransaction();
      console.log(`⚠️ No updates applied: ${results.failed.length} failed, ${results.skipped.length} skipped`);
    }

    return NextResponse.json({
      success: true,
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
    console.error('❌ Bulk update error:', error);
    return NextResponse.json({ 
      error: 'Bulk update failed',
      details: error.message 
    }, { status: 500 });
  } finally {
    session.endSession();
  }
}

/**
 * Get bulk update status and history
 */
export async function GET(request) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession || authSession.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit')) || 50;

    // Get recent user updates
    const recentUpdates = await User.find({
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    })
    .select('gitlabUsername name role isActive cohortId college updatedAt lastTokenRefresh')
    .populate(['college', 'cohortId'])
    .sort({ updatedAt: -1 })
    .limit(limit);

    // Get statistics
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactiveUsers: { $sum: { $cond: ['$isActive', 0, 1] } },
          usersWithCohorts: { $sum: { $cond: [{ $ne: ['$cohortId', null] }, 1, 0] } },
          usersWithoutCohorts: { $sum: { $cond: [{ $eq: ['$cohortId', null] }, 1, 0] } }
        }
      }
    ]);

    return NextResponse.json({
      recentUpdates,
      statistics: stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        usersWithCohorts: 0,
        usersWithoutCohorts: 0
      }
    });

  } catch (error) {
    console.error('Error fetching bulk update status:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch status',
      details: error.message 
    }, { status: 500 });
  }
}