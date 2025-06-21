import mongoose from 'mongoose';

/**
 * Activity Tracking Schema
 * Stores detailed GitLab activity data for analytics and progress tracking
 */
const ActivityTrackingSchema = new mongoose.Schema({
  // User identification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Activity type and identification
  type: {
    type: String,
    enum: ['commit', 'issue', 'merge_request', 'review', 'comment', 'push'],
    required: true
  },
  gitlabId: {
    type: String,
    required: true
  },

  // Project context
  projectId: {
    type: Number,
    required: true
  },
  projectName: {
    type: String,
    required: true
  },
  projectUrl: {
    type: String,
    required: true
  },
  projectPath: {
    type: String,
    required: true
  },

  // Activity details
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    required: true
  },

  // Timestamps
  activityCreatedAt: {
    type: Date,
    required: true
  },
  activityUpdatedAt: {
    type: Date,
    default: null
  },

  // Type-specific metadata
  metadata: {
    // Commit-specific fields
    sha: {
      type: String,
      default: null
    },
    additions: {
      type: Number,
      default: 0
    },
    deletions: {
      type: Number,
      default: 0
    },
    filesChanged: {
      type: Number,
      default: 0
    },
    parentIds: [{
      type: String
    }],
    
    // Issue-specific fields
    state: {
      type: String,
      default: null
    },
    labels: [{
      type: String
    }],
    assignees: [{
      id: Number,
      username: String,
      name: String
    }],
    milestone: {
      id: Number,
      title: String,
      description: String
    },
    
    // Merge Request-specific fields
    sourceBranch: {
      type: String,
      default: null
    },
    targetBranch: {
      type: String,
      default: null
    },
    changesCount: {
      type: Number,
      default: 0
    },
    mergeStatus: {
      type: String,
      default: null
    },
    
    // Review-specific fields
    reviewType: {
      type: String,
      enum: ['approved', 'unapproved', 'commented'],
      default: null
    },
    
    // Additional context
    branch: {
      type: String,
      default: null
    },
    tags: [{
      type: String
    }],
    language: {
      type: String,
      default: null
    }
  },

  // Analytics fields
  impact: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  complexity: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },

  // Tracking metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  syncedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
ActivityTrackingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Compound indexes for efficient queries
ActivityTrackingSchema.index({ userId: 1, type: 1 });
ActivityTrackingSchema.index({ userId: 1, activityCreatedAt: -1 });
ActivityTrackingSchema.index({ projectId: 1, type: 1 });
ActivityTrackingSchema.index({ gitlabId: 1, type: 1 }, { unique: true });
ActivityTrackingSchema.index({ userId: 1, type: 1, activityCreatedAt: -1 });

// Static methods for analytics
ActivityTrackingSchema.statics.getUserStats = async function(userId, dateRange = {}) {
  const { startDate, endDate } = dateRange;
  const matchConditions = { userId };
  
  if (startDate || endDate) {
    matchConditions.activityCreatedAt = {};
    if (startDate) matchConditions.activityCreatedAt.$gte = new Date(startDate);
    if (endDate) matchConditions.activityCreatedAt.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAdditions: { $sum: '$metadata.additions' },
        totalDeletions: { $sum: '$metadata.deletions' },
        projects: { $addToSet: '$projectName' },
        lastActivity: { $max: '$activityCreatedAt' }
      }
    }
  ]);
};

ActivityTrackingSchema.statics.getProjectStats = async function(projectId, dateRange = {}) {
  const { startDate, endDate } = dateRange;
  const matchConditions = { projectId };
  
  if (startDate || endDate) {
    matchConditions.activityCreatedAt = {};
    if (startDate) matchConditions.activityCreatedAt.$gte = new Date(startDate);
    if (endDate) matchConditions.activityCreatedAt.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$userId',
        commits: { $sum: { $cond: [{ $eq: ['$type', 'commit'] }, 1, 0] } },
        issues: { $sum: { $cond: [{ $eq: ['$type', 'issue'] }, 1, 0] } },
        mergeRequests: { $sum: { $cond: [{ $eq: ['$type', 'merge_request'] }, 1, 0] } },
        totalAdditions: { $sum: '$metadata.additions' },
        totalDeletions: { $sum: '$metadata.deletions' },
        lastActivity: { $max: '$activityCreatedAt' }
      }
    }
  ]);
};

export default mongoose.models.ActivityTracking || mongoose.model('ActivityTracking', ActivityTrackingSchema);