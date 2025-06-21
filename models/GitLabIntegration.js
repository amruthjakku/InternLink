import mongoose from 'mongoose';

/**
 * GitLab Integration Schema
 * Stores encrypted OAuth tokens and repository tracking preferences
 */
const GitLabIntegrationSchema = new mongoose.Schema({
  // User identification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  gitlabUserId: {
    type: Number,
    required: true
  },
  gitlabUsername: {
    type: String,
    required: true
  },
  gitlabEmail: {
    type: String,
    required: true
  },

  // Encrypted OAuth tokens
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  tokenExpiresAt: {
    type: Date,
    required: true
  },

  // Repository tracking
  repositories: [{
    projectId: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    nameWithNamespace: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    isTracked: {
      type: Boolean,
      default: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    lastSyncAt: {
      type: Date,
      default: null
    }
  }],

  // Permissions and settings
  permissions: {
    canAccessRepositories: {
      type: Boolean,
      default: true
    },
    canTrackCommits: {
      type: Boolean,
      default: true
    },
    canManageIssues: {
      type: Boolean,
      default: true
    },
    canViewAnalytics: {
      type: Boolean,
      default: true
    }
  },

  // Sync tracking
  lastSyncAt: {
    type: Date,
    default: null
  },
  lastSuccessfulSyncAt: {
    type: Date,
    default: null
  },
  syncErrors: [{
    error: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isConnected: {
    type: Boolean,
    default: true
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
GitLabIntegrationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for better query performance
GitLabIntegrationSchema.index({ userId: 1 });
GitLabIntegrationSchema.index({ gitlabUserId: 1 });
GitLabIntegrationSchema.index({ isActive: 1, tokenExpiresAt: 1 });
GitLabIntegrationSchema.index({ 'repositories.projectId': 1 });

export default mongoose.models.GitLabIntegration || mongoose.model('GitLabIntegration', GitLabIntegrationSchema);