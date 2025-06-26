import { connectToDatabase } from '../utils/database';
import User from '../models/User';
import Cohort from '../models/Cohort';

/**
 * Data synchronization middleware to ensure consistency across database, backend, and frontend
 */
export class DataSyncMiddleware {
  constructor() {
    this.syncQueue = new Map();
    this.isProcessing = false;
  }

  /**
   * Add a sync operation to the queue
   */
  queueSync(operation) {
    const key = `${operation.type}_${operation.id}`;
    this.syncQueue.set(key, {
      ...operation,
      timestamp: new Date(),
      retries: 0
    });

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process the sync queue
   */
  async processQueue() {
    if (this.isProcessing || this.syncQueue.size === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Processing ${this.syncQueue.size} sync operations...`);

    try {
      await connectToDatabase();

      for (const [key, operation] of this.syncQueue.entries()) {
        try {
          await this.processSyncOperation(operation);
          this.syncQueue.delete(key);
          console.log(`✅ Sync completed: ${operation.type} for ${operation.id}`);
        } catch (error) {
          console.error(`❌ Sync failed: ${operation.type} for ${operation.id}:`, error);
          
          // Retry logic
          operation.retries++;
          if (operation.retries >= 3) {
            console.error(`🚫 Max retries reached for ${key}, removing from queue`);
            this.syncQueue.delete(key);
          } else {
            console.log(`🔄 Retrying ${key} (attempt ${operation.retries + 1}/3)`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Queue processing error:', error);
    } finally {
      this.isProcessing = false;
      
      // If there are still items in queue, schedule another processing
      if (this.syncQueue.size > 0) {
        setTimeout(() => this.processQueue(), 5000); // Retry in 5 seconds
      }
    }
  }

  /**
   * Process individual sync operation
   */
  async processSyncOperation(operation) {
    switch (operation.type) {
      case 'user_update':
        await this.syncUserUpdate(operation);
        break;
      
      case 'cohort_assignment':
        await this.syncCohortAssignment(operation);
        break;
      
      case 'user_activation':
        await this.syncUserActivation(operation);
        break;
      
      case 'cohort_member_count':
        await this.syncCohortMemberCount(operation);
        break;
      
      default:
        throw new Error(`Unknown sync operation type: ${operation.type}`);
    }
  }

  /**
   * Sync user update across all systems
   */
  async syncUserUpdate(operation) {
    const { id, data, originalData } = operation;
    
    console.log(`🔄 Syncing user update for ${id}...`);
    
    // Update user in database
    const user = await User.findByIdAndUpdate(
      id,
      {
        ...data,
        updatedAt: new Date(),
        lastTokenRefresh: new Date() // Force session refresh
      },
      { new: true, runValidators: true }
    ).populate(['college', 'cohortId']);

    if (!user) {
      throw new Error('User not found');
    }

    // Update related cohort statistics if cohort changed
    const cohortsToUpdate = new Set();
    if (originalData?.cohortId) cohortsToUpdate.add(String(originalData.cohortId));
    if (user.cohortId) cohortsToUpdate.add(String(user.cohortId));

    for (const cohortId of cohortsToUpdate) {
      this.queueSync({
        type: 'cohort_member_count',
        id: cohortId,
        cohortId
      });
    }

    // Log the change
    console.log(`✅ User ${user.gitlabUsername} updated successfully`);
    
    return user;
  }

  /**
   * Sync cohort assignment
   */
  async syncCohortAssignment(operation) {
    const { userId, cohortId, action, originalCohortId } = operation;
    
    console.log(`🔄 Syncing cohort assignment: ${action} user ${userId} ${action === 'assign' ? 'to' : 'from'} cohort ${cohortId}...`);
    
    const updateData = {
      cohortId: action === 'assign' ? cohortId : null,
      updatedAt: new Date()
    };

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).populate('cohortId');

    if (!user) {
      throw new Error('User not found');
    }

    // Update cohort member counts
    const cohortsToUpdate = new Set();
    if (originalCohortId) cohortsToUpdate.add(String(originalCohortId));
    if (cohortId) cohortsToUpdate.add(String(cohortId));

    for (const cohortId of cohortsToUpdate) {
      this.queueSync({
        type: 'cohort_member_count',
        id: cohortId,
        cohortId
      });
    }

    console.log(`✅ Cohort assignment synced for user ${user.gitlabUsername}`);
    
    return user;
  }

  /**
   * Sync user activation/deactivation
   */
  async syncUserActivation(operation) {
    const { userId, isActive, reason, adminUsername } = operation;
    
    console.log(`🔄 Syncing user ${isActive ? 'activation' : 'deactivation'} for ${userId}...`);
    
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updateData = {
      isActive,
      updatedAt: new Date(),
      lastTokenRefresh: new Date() // Force session refresh
    };

    if (isActive && !user.isActive) {
      // Reactivating user
      updateData.reactivatedAt = new Date();
      updateData.reactivationReason = reason || 'Admin action';
      updateData.reactivatedBy = adminUsername || 'system';
      updateData.deactivatedAt = null;
      updateData.deactivationReason = null;
      updateData.deactivatedBy = null;
    } else if (!isActive && user.isActive) {
      // Deactivating user
      updateData.deactivatedAt = new Date();
      updateData.deactivationReason = reason || 'Admin action';
      updateData.deactivatedBy = adminUsername || 'system';
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).populate(['college', 'cohortId']);

    // Update cohort member count if user has a cohort
    if (updatedUser.cohortId) {
      this.queueSync({
        type: 'cohort_member_count',
        id: updatedUser.cohortId._id,
        cohortId: updatedUser.cohortId._id
      });
    }

    console.log(`✅ User ${updatedUser.gitlabUsername} ${isActive ? 'activated' : 'deactivated'} successfully`);
    
    return updatedUser;
  }

  /**
   * Sync cohort member count
   */
  async syncCohortMemberCount(operation) {
    const { cohortId } = operation;
    
    console.log(`🔄 Syncing member count for cohort ${cohortId}...`);
    
    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      throw new Error('Cohort not found');
    }

    // Count active members
    const memberCount = await User.countDocuments({
      cohortId: cohortId,
      isActive: true
    });

    // Update cohort
    const updatedCohort = await Cohort.findByIdAndUpdate(
      cohortId,
      { 
        memberCount,
        updatedAt: new Date()
      },
      { new: true }
    );

    console.log(`✅ Cohort ${updatedCohort.name} member count updated: ${memberCount}`);
    
    return updatedCohort;
  }

  /**
   * Validate data integrity
   */
  async validateIntegrity() {
    console.log('🔍 Validating data integrity...');
    
    try {
      await connectToDatabase();
      
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
        }
      ]);

      if (usersWithInvalidCohorts.length > 0) {
        issues.push({
          type: 'invalid_cohort_references',
          count: usersWithInvalidCohorts.length,
          users: usersWithInvalidCohorts
        });

        // Auto-fix: Remove invalid cohort references
        for (const user of usersWithInvalidCohorts) {
          this.queueSync({
            type: 'user_update',
            id: user._id,
            data: { cohortId: null },
            originalData: { cohortId: user.cohortId }
          });
        }
      }

      // Check cohort member counts
      const cohorts = await Cohort.find({});
      for (const cohort of cohorts) {
        const actualCount = await User.countDocuments({
          cohortId: cohort._id,
          isActive: true
        });

        if (cohort.memberCount !== actualCount) {
          issues.push({
            type: 'incorrect_member_count',
            cohortId: cohort._id,
            cohortName: cohort.name,
            recorded: cohort.memberCount,
            actual: actualCount
          });

          // Auto-fix: Update member count
          this.queueSync({
            type: 'cohort_member_count',
            id: cohort._id,
            cohortId: cohort._id
          });
        }
      }

      console.log(`🔍 Integrity check completed: ${issues.length} issues found`);
      
      return {
        valid: issues.length === 0,
        issues,
        autoFixApplied: issues.length > 0
      };
    } catch (error) {
      console.error('❌ Integrity validation error:', error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      queueSize: this.syncQueue.size,
      isProcessing: this.isProcessing,
      operations: Array.from(this.syncQueue.values()).map(op => ({
        type: op.type,
        id: op.id,
        timestamp: op.timestamp,
        retries: op.retries
      }))
    };
  }
}

// Create singleton instance
export const dataSyncMiddleware = new DataSyncMiddleware();

/**
 * Express middleware function
 */
export function createDataSyncMiddleware() {
  return (req, res, next) => {
    // Add sync methods to request object
    req.syncData = {
      queueSync: (operation) => dataSyncMiddleware.queueSync(operation),
      validateIntegrity: () => dataSyncMiddleware.validateIntegrity(),
      getSyncStatus: () => dataSyncMiddleware.getSyncStatus()
    };
    
    next();
  };
}

// Auto-start integrity validation on module load
setTimeout(() => {
  dataSyncMiddleware.validateIntegrity().catch(error => {
    console.error('❌ Initial integrity validation failed:', error);
  });
}, 5000); // Wait 5 seconds after startup