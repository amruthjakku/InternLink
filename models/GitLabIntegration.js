import mongoose from 'mongoose';

/**
 * GitLab Integration Schema
 * Stores encrypted OAuth tokens and repository tracking preferences
 */
const GitLabIntegrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  gitlabId: {
    type: Number,
    required: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: String,
  tokenType: {
    type: String,
    enum: ['oauth', 'personal_access_token'],
    default: 'oauth',
  },
  tokenExpiresAt: Date,
  repositories: [{
    projectId: { type: Number, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    isTracked: { type: Boolean, default: true },
  }],
  lastSync: {
    at: Date,
    status: String,
    error: String,
  },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
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