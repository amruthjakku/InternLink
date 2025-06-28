import mongoose from 'mongoose';

const cohortSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  maxInterns: {
    type: Number,
    default: 50
  },
  currentInterns: {
    type: Number,
    default: 0
  },
  memberCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
cohortSchema.index({ name: 1 });
cohortSchema.index({ mentorId: 1 });
cohortSchema.index({ collegeId: 1 });
cohortSchema.index({ isActive: 1 });

// Pre-save middleware to update timestamps
cohortSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
cohortSchema.statics.getActiveCohorts = function() {
  return this.find({ isActive: true }).sort({ startDate: -1 });
};

cohortSchema.statics.getCohortById = function(id) {
  return this.findById(id);
};

// Instance methods
cohortSchema.methods.updateInternCount = async function() {
  const User = mongoose.models.User;
  const count = await User.countDocuments({ 
    cohortId: this._id,
    role: 'intern',
    isActive: true
  });
  
  this.currentInterns = count;
  return this.save();
};

cohortSchema.methods.updateMemberCount = async function() {
  const User = mongoose.models.User;
  const count = await User.countDocuments({ 
    cohortId: this._id,
    isActive: true
  });
  
  this.memberCount = count;
  this.currentInterns = await User.countDocuments({ 
    cohortId: this._id,
    role: 'intern',
    isActive: true
  });
  
  return this.save();
};

cohortSchema.methods.addMember = function(userId) {
  this.memberCount += 1;
  this.updatedAt = new Date();
  return this.save();
};

cohortSchema.methods.removeMember = function(userId) {
  this.memberCount = Math.max(0, this.memberCount - 1);
  this.updatedAt = new Date();
  return this.save();
};

// Static methods for bulk operations
cohortSchema.statics.syncAllMemberCounts = async function() {
  const cohorts = await this.find({ isActive: true });
  const results = {
    updated: 0,
    errors: []
  };
  
  for (const cohort of cohorts) {
    try {
      await cohort.updateMemberCount();
      results.updated++;
    } catch (error) {
      results.errors.push({
        cohortId: cohort._id,
        cohortName: cohort.name,
        error: error.message
      });
    }
  }
  
  return results;
};

cohortSchema.statics.assignUsers = async function(cohortId, userIds, assignedBy = 'system') {
  const User = mongoose.models.User;
  const cohort = await this.findById(cohortId);
  
  if (!cohort) {
    throw new Error('Cohort not found');
  }
  
  const results = {
    successful: [],
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
      
      if (!user.isActive) {
        results.failed.push({
          userId,
          username: user.gitlabUsername,
          error: 'User is not active'
        });
        continue;
      }
      
      if (user.cohortId && user.cohortId.toString() === cohortId) {
        results.skipped.push({
          userId,
          username: user.gitlabUsername,
          reason: 'Already assigned to this cohort'
        });
        continue;
      }
      
      // Use the enhanced assignToCohort method
      await user.assignToCohort(cohortId, assignedBy);
      
      results.successful.push({
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
  
  // Update cohort member count
  await cohort.updateMemberCount();
  
  return results;
};

cohortSchema.statics.removeUsers = async function(cohortId, userIds, removedBy = 'system') {
  const User = mongoose.models.User;
  const cohort = await this.findById(cohortId);
  
  if (!cohort) {
    throw new Error('Cohort not found');
  }
  
  const results = {
    successful: [],
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
      
      if (!user.cohortId || user.cohortId.toString() !== cohortId) {
        results.skipped.push({
          userId,
          username: user.gitlabUsername,
          reason: 'Not assigned to this cohort'
        });
        continue;
      }
      
      // Use the enhanced removeFromCohort method
      await user.removeFromCohort(removedBy);
      
      results.successful.push({
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
  
  // Update cohort member count
  await cohort.updateMemberCount();
  
  return results;
};

export default mongoose.models.Cohort || mongoose.model('Cohort', cohortSchema);