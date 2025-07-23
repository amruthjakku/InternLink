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
    enum: ['admin', 'POC', 'Tech Lead', 'AI Developer Intern'],
    default: 'AI Developer Intern'
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: function () {
      return ['AI Developer Intern', 'Tech Lead', 'POC'].includes(this.role) && this.assignedBy !== 'auto-registration';
    }
  },
  cohortId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cohort'
  },
  assignedBy: {
    type: String,
    required: true,
    trim: true
  },
  assignedTechLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function () {
      return this.role === 'AI Developer Intern' && this.assignedBy !== 'auto-registration';
    }
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
  },
  dashboardPreferences: {
    tabOrder: {
      type: [String],
      default: ['progress', 'tasks', 'performance', 'gitlab', 'meetings', 'profile', 'leaderboard', 'attendance', 'chat', 'ai-assistant']
    }
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ college: 1 });
userSchema.index({ assignedTechLead: 1 });
userSchema.index({ cohortId: 1 });

// Virtuals
userSchema.virtual('collegeName', {
  ref: 'College',
  localField: 'college',
  foreignField: '_id',
  justOne: true
});

userSchema.virtual('cohortName', {
  ref: 'Cohort',
  localField: 'cohortId',
  foreignField: '_id',
  justOne: true
});

userSchema.set('toJSON', { virtuals: true });

userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
userSchema.statics.findByGitLabUsername = function (username, populateFields = '') {
  const query = { gitlabUsername: username.toLowerCase() };
  let mongooseQuery = this.findOne(query);

  if (populateFields) {
    if (typeof populateFields === 'string') {
      const fields = populateFields.split(' ');
      if (fields.includes('cohortId')) {
        try {
          const Cohort = mongoose.models.Cohort || require('../models/Cohort').default;
          const otherFields = fields.filter(field => field !== 'cohortId');
          if (otherFields.length > 0) {
            mongooseQuery = mongooseQuery.populate(otherFields.join(' '));
          }
          mongooseQuery = mongooseQuery.populate({
            path: 'cohortId',
            select: 'name startDate endDate maxAIDeveloperInterns currentAIDeveloperInterns'
          });
        } catch (error) {
          console.warn('Warning: Could not populate cohortId field:', error.message);
          const otherFields = fields.filter(field => field !== 'cohortId');
          if (otherFields.length > 0) {
            mongooseQuery = mongooseQuery.populate(otherFields.join(' '));
          }
        }
      } else {
        mongooseQuery = mongooseQuery.populate(populateFields);
      }
    } else {
      mongooseQuery = mongooseQuery.populate(populateFields);
    }
  }

  return mongooseQuery;
};

userSchema.statics.findAnyByGitLabUsername = function (username, populateFields = '') {
  return this.findByGitLabUsername(username, populateFields);
};

userSchema.statics.findByRole = function (role, collegeId = null) {
  const query = { role };
  if (collegeId) {
    query.college = collegeId;
  }
  return this.find(query).populate('college');
};

userSchema.statics.getAdmins = function () {
  return this.find({ role: 'admin' });
};

userSchema.statics.getTechLeadsByCollege = function (collegeId) {
  return this.find({ role: 'Tech Lead', college: collegeId }).populate('college');
};

userSchema.statics.getAIDeveloperInternsByTechLead = function (techLeadUsername) {
  return this.findOne({ gitlabUsername: techLeadUsername, role: 'Tech Lead' })
    .populate('college')
    .then(techLead => {
      if (!techLead) return [];
      return this.find({
        role: 'AI Developer Intern',
        assignedTechLead: techLead._id
      }).populate('college');
    });
};

userSchema.statics.getPOCsByCollege = function (collegeId) {
  return this.find({ role: 'POC', college: collegeId }).populate('college');
};

userSchema.statics.getAIDeveloperInternsByPOC = function (pocUsername) {
  return this.findOne({ gitlabUsername: pocUsername, role: 'POC' })
    .populate('college')
    .then(poc => {
      if (!poc) return [];
      return this.find({ role: 'AI Developer Intern', college: poc.college }).populate('college');
    });
};

userSchema.statics.getTechLeadsByPOC = function (pocUsername) {
  return this.findOne({ gitlabUsername: pocUsername, role: 'POC' })
    .populate('college')
    .then(poc => {
      if (!poc) return [];
      return this.find({ role: 'Tech Lead', college: poc.college }).populate('college');
    });
};

// Instance methods

userSchema.methods.canAccessCollege = function (collegeId) {
  if (this.role === 'admin') return true;
  return ['POC', 'Tech Lead', 'AI Developer Intern'].includes(this.role) &&
    this.college.toString() === collegeId.toString();
};

userSchema.methods.updateLastLogin = function () {
  this.lastLoginAt = new Date();
  return this.save();
};

userSchema.methods.assignToCohort = function (cohortId, assignedBy = 'system') {
  const originalCohortId = this.cohortId;
  this.cohortId = cohortId;
  this.updatedAt = new Date();

  return this.save().then(savedUser => {
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

userSchema.methods.removeFromCohort = function (removedBy = 'system') {
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

userSchema.statics.bulkUpdateWithValidation = function (userIds, updateData, updatedBy = 'system') {
  const results = {
    successful: [],
    failed: [],
    skipped: []
  };

  return Promise.all(userIds.map(userId => {
    return this.findById(userId).then(user => {
      if (!user) {
        results.failed.push({ userId, error: 'User not found' });
        return;
      }

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

      Object.assign(user, changes);
      user.updatedAt = new Date();
      user.sessionVersion += 1;

      return user.save().then(savedUser => {
        results.successful.push({
          userId,
          username: savedUser.gitlabUsername,
          changes
        });
      });
    }).catch(error => {
      results.failed.push({ userId, error: error.message });
    });
  })).then(() => results);
};

export default mongoose.models.User || mongoose.model('User', userSchema);
