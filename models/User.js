import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  gitlabUsername: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  gitlabId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'super-mentor', 'mentor', 'intern'],
    default: 'intern'
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: function() {
      return this.role === 'intern' || this.role === 'mentor' || this.role === 'super-mentor';
    }
  },
  // Add cohortId field to associate users with cohorts
  cohortId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cohort'
  },
  assignedBy: {
    type: String,
    required: true,
    trim: true
  },
  assignedMentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.role === 'intern';
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Soft delete tracking fields
  deactivatedAt: {
    type: Date,
    default: null
  },
  deactivationReason: {
    type: String,
    default: null
  },
  deactivatedBy: {
    type: String,
    default: null
  },
  reactivatedAt: {
    type: Date,
    default: null
  },
  reactivationReason: {
    type: String,
    default: null
  },
  reactivatedBy: {
    type: String,
    default: null
  },
  profileImage: {
    type: String,
    default: null
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastTokenRefresh: {
    type: Date,
    default: null
  },
  sessionVersion: {
    type: Number,
    default: 1
  },
  lastSessionReset: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better performance
// Note: gitlabUsername and gitlabId already have unique indexes from schema definition
userSchema.index({ role: 1 });
userSchema.index({ college: 1 });
userSchema.index({ assignedMentor: 1 });
userSchema.index({ cohortId: 1 }); // Add index for cohortId

// Virtual for college name (populated)
userSchema.virtual('collegeName', {
  ref: 'College',
  localField: 'college',
  foreignField: '_id',
  justOne: true
});

// Virtual for cohort name (populated)
userSchema.virtual('cohortName', {
  ref: 'Cohort',
  localField: 'cohortId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to update timestamps
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
userSchema.statics.findByGitLabUsername = function(username, populateFields = '', includeInactive = false) {
  const query = { gitlabUsername: username.toLowerCase() };
  if (!includeInactive) query.isActive = true;
  let mongooseQuery = this.findOne(query);
  
  // Handle populate fields
  if (populateFields) {
    // If populateFields is a string, split it by spaces to get individual fields
    if (typeof populateFields === 'string') {
      const fields = populateFields.split(' ');
      
      // Check if cohortId is in the fields to populate
      if (fields.includes('cohortId')) {
        try {
          // Make sure Cohort model is available
          const Cohort = mongoose.models.Cohort || require('../models/Cohort').default;
          
          // Remove cohortId from fields and add it as a separate populate
          const otherFields = fields.filter(field => field !== 'cohortId');
          
          // Populate other fields if any
          if (otherFields.length > 0) {
            mongooseQuery = mongooseQuery.populate(otherFields.join(' '));
          }
          
          // Populate cohortId with name and other relevant fields
          mongooseQuery = mongooseQuery.populate({
            path: 'cohortId',
            select: 'name startDate endDate maxInterns currentInterns'
          });
        } catch (error) {
          console.warn('Warning: Could not populate cohortId field:', error.message);
          
          // Just populate other fields if any
          const otherFields = fields.filter(field => field !== 'cohortId');
          if (otherFields.length > 0) {
            mongooseQuery = mongooseQuery.populate(otherFields.join(' '));
          }
        }
      } else {
        // Just populate as requested
        mongooseQuery = mongooseQuery.populate(populateFields);
      }
    } else {
      // If populateFields is not a string (e.g., an object), just use it
      mongooseQuery = mongooseQuery.populate(populateFields);
    }
  }
  
  return mongooseQuery;
};

// Find user by GitLab username, including inactive users (for login/reactivation logic)
userSchema.statics.findAnyByGitLabUsername = function(username, populateFields = '') {
  const query = { gitlabUsername: username.toLowerCase() };
  let mongooseQuery = this.findOne(query);
  if (populateFields) {
    mongooseQuery = mongooseQuery.populate(populateFields);
  }
  return mongooseQuery;
};

userSchema.statics.findByRole = function(role, collegeId = null) {
  const query = { role, isActive: true };
  if (collegeId) {
    query.college = collegeId;
  }
  return this.find(query).populate('college');
};

userSchema.statics.getAdmins = function() {
  return this.find({ role: 'admin', isActive: true });
};

userSchema.statics.getMentorsByCollege = function(collegeId) {
  return this.find({ role: 'mentor', college: collegeId, isActive: true }).populate('college');
};

userSchema.statics.getInternsByMentor = function(mentorUsername) {
  return this.findOne({ gitlabUsername: mentorUsername, role: 'mentor' })
    .populate('college')
    .then(mentor => {
      if (!mentor) return [];
      return this.find({ 
        role: 'intern', 
        assignedMentor: mentor._id, 
        isActive: true 
      }).populate('college');
    });
};

userSchema.statics.getSuperMentorsByCollege = function(collegeId) {
  return this.find({ role: 'super-mentor', college: collegeId, isActive: true }).populate('college');
};

userSchema.statics.getInternsBySuperMentor = function(superMentorUsername) {
  return this.findOne({ gitlabUsername: superMentorUsername, role: 'super-mentor' })
    .populate('college')
    .then(superMentor => {
      if (!superMentor) return [];
      return this.find({ role: 'intern', college: superMentor.college, isActive: true }).populate('college');
    });
};

userSchema.statics.getMentorsBySuperMentor = function(superMentorUsername) {
  return this.findOne({ gitlabUsername: superMentorUsername, role: 'super-mentor' })
    .populate('college')
    .then(superMentor => {
      if (!superMentor) return [];
      return this.find({ role: 'mentor', college: superMentor.college, isActive: true }).populate('college');
    });
};

// Instance methods
userSchema.methods.canManageUser = function(targetUser) {
  if (this.role === 'admin') return true;
  if (this.role === 'super-mentor') {
    // Super-mentor can manage interns and mentors in their college
    if (targetUser.role === 'intern' || targetUser.role === 'mentor') {
      return this.college.toString() === targetUser.college.toString();
    }
  }
  if (this.role === 'mentor' && targetUser.role === 'intern') {
    return this.college.toString() === targetUser.college.toString();
  }
  return false;
};

userSchema.methods.canAccessCollege = function(collegeId) {
  if (this.role === 'admin') return true;
  if (this.role === 'super-mentor' || this.role === 'mentor' || this.role === 'intern') {
    return this.college.toString() === collegeId.toString();
  }
  return false;
};

userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

// Enhanced soft delete methods
userSchema.methods.softDelete = function(reason = 'Admin action', deletedBy = 'system') {
  this.isActive = false;
  this.deactivatedAt = new Date();
  this.deactivationReason = reason;
  this.deactivatedBy = deletedBy;
  this.sessionVersion += 1; // Force session invalidation
  this.lastSessionReset = new Date();
  this.updatedAt = new Date();
  return this.save();
};

userSchema.methods.reactivate = function(reason = 'Admin action', reactivatedBy = 'system') {
  // Check for conflicts before reactivating
  return this.constructor.findOne({
    $or: [
      { gitlabUsername: this.gitlabUsername },
      { email: this.email }
    ],
    _id: { $ne: this._id },
    isActive: true
  }).then(existingUser => {
    if (existingUser) {
      throw new Error(`Cannot reactivate: ${existingUser.gitlabUsername === this.gitlabUsername ? 'GitLab username' : 'Email'} is already in use by another active user`);
    }
    
    // Clear deactivation data and set reactivation data
    this.isActive = true;
    this.reactivatedAt = new Date();
    this.reactivationReason = reason;
    this.reactivatedBy = reactivatedBy;
    this.deactivatedAt = null;
    this.deactivationReason = null;
    this.deactivatedBy = null;
    this.sessionVersion += 1; // Force session refresh
    this.lastTokenRefresh = new Date();
    this.updatedAt = new Date();
    
    return this.save();
  });
};

userSchema.methods.assignToCohort = function(cohortId, assignedBy = 'system') {
  const originalCohortId = this.cohortId;
  this.cohortId = cohortId;
  this.updatedAt = new Date();
  
  return this.save().then(savedUser => {
    // Update cohort member counts
    const updatePromises = [];
    
    if (originalCohortId) {
      updatePromises.push(
        this.constructor.model('Cohort').findByIdAndUpdate(
          originalCohortId,
          { $inc: { memberCount: -1 }, updatedAt: new Date() }
        )
      );
    }
    
    if (cohortId) {
      updatePromises.push(
        this.constructor.model('Cohort').findByIdAndUpdate(
          cohortId,
          { $inc: { memberCount: 1 }, updatedAt: new Date() }
        )
      );
    }
    
    return Promise.all(updatePromises).then(() => savedUser);
  });
};

userSchema.methods.removeFromCohort = function(removedBy = 'system') {
  const originalCohortId = this.cohortId;
  this.cohortId = null;
  this.updatedAt = new Date();
  
  return this.save().then(savedUser => {
    if (originalCohortId) {
      return this.constructor.model('Cohort').findByIdAndUpdate(
        originalCohortId,
        { $inc: { memberCount: -1 }, updatedAt: new Date() }
      ).then(() => savedUser);
    }
    return savedUser;
  });
};

// Static method for safe reactivation with conflict checking
userSchema.statics.safeReactivate = function(userId, reason = 'Admin action', reactivatedBy = 'system') {
  return this.findById(userId).then(user => {
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.isActive) {
      throw new Error('User is already active');
    }
    
    return user.reactivate(reason, reactivatedBy);
  });
};

// Static method for bulk operations with proper error handling
userSchema.statics.bulkUpdateWithValidation = function(userIds, updateData, updatedBy = 'system') {
  const results = {
    successful: [],
    failed: [],
    skipped: []
  };
  
  return Promise.all(userIds.map(userId => {
    return this.findById(userId).then(user => {
      if (!user) {
        results.failed.push({
          userId,
          error: 'User not found'
        });
        return;
      }
      
      // Check if update is needed
      let needsUpdate = false;
      const changes = {};
      
      Object.keys(updateData).forEach(key => {
        if (user[key] !== updateData[key]) {
          needsUpdate = true;
          changes[key] = updateData[key];
        }
      });
      
      if (!needsUpdate) {
        results.skipped.push({
          userId,
          username: user.gitlabUsername,
          reason: 'No changes needed'
        });
        return;
      }
      
      // Apply updates
      Object.assign(user, changes);
      user.updatedAt = new Date();
      user.sessionVersion += 1; // Force session refresh
      
      return user.save().then(savedUser => {
        results.successful.push({
          userId,
          username: savedUser.gitlabUsername,
          changes
        });
      });
    }).catch(error => {
      results.failed.push({
        userId,
        error: error.message
      });
    });
  })).then(() => results);
};

export default mongoose.models.User || mongoose.model('User', userSchema);