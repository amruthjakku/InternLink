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
    required: false
  },

  // Token information (supports both OAuth and Personal Access Token)
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: false // Not needed for Personal Access Tokens
  },
  tokenType: {
    type: String,
    enum: ['oauth', 'personal_access_token'],
    default: 'oauth'
  },
  tokenExpiresAt: {
    type: Date,
    required: false // Personal Access Tokens don't expire automatically
  },
  
  // GitLab instance configuration
  gitlabInstance: {
    type: String,
    default: 'https://code.swecha.org' // Default to Swecha instance
  },
  apiBase: {
    type: String,
    default: 'https://code.swecha.org/api/v4'
  },

  // For Personal Access Token connections
  specificRepositories: [{
    type: String // Repository names to track specifically
  }],
  
  // User profile information from GitLab
  userProfile: {
    name: String,
    email: String,
    avatarUrl: String,
    webUrl: String
  },

  // Connection timestamp
  connectedAt: {
    type: Date,
    default: Date.now
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
    fullName: {
      type: String, // path_with_namespace
      required: false
    },
    nameWithNamespace: {
      type: String,
      required: false
    },
    url: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: false
    },
    language: {
      type: String,
      required: false
    },
    visibility: {
      type: String,
      enum: ['private', 'internal', 'public'],
      default: 'private'
    },
    isTracked: {
      type: Boolean,
      default: true
    },
    lastActivity: {
      type: Date,
      required: false
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
    canViewIssues: {
      type: Boolean,
      default: true
    },
    canViewMergeRequests: {
      type: Boolean,
      default: true
    },
    canManageIssues: {
      type: Boolean,
      default: false // Usually not needed for tracking
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
// Note: userId already has unique index from schema definition
GitLabIntegrationSchema.index({ gitlabUserId: 1 });
GitLabIntegrationSchema.index({ isActive: 1, tokenExpiresAt: 1 });
GitLabIntegrationSchema.index({ 'repositories.projectId': 1 });

export default mongoose.models.GitLabIntegration || mongoose.model('GitLabIntegration', GitLabIntegrationSchema);