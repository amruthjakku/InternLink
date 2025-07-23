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
  isActive: {
    type: Boolean,
    default: true,
  },
  deactivatedAt: {
    type: Date,
    default: null,
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
userSchema.index({ gitlabUsername: 1 }, { unique: true });
userSchema.index({ email: 1, isActive: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, college: 1 });

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
  return this.findOne({ gitlabUsername: username.toLowerCase() }).populate(populateFields);
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

userSchema.statics.getAIDeveloperInternsByTechLead = async function (techLeadId) {
  return this.find({ role: 'AI Developer Intern', assignedTechLead: techLeadId }).populate('college');
};

userSchema.statics.getPOCsByCollege = function (collegeId) {
  return this.find({ role: 'POC', college: collegeId }).populate('college');
};

userSchema.statics.getAIDeveloperInternsByPOC = async function (pocId) {
  const poc = await this.findById(pocId);
  if (!poc || !poc.college) return [];
  return this.find({ role: 'AI Developer Intern', college: poc.college }).populate('college');
};

userSchema.statics.getTechLeadsByPOC = async function (pocId) {
  const poc = await this.findById(pocId);
  if (!poc || !poc.college) return [];
  return this.find({ role: 'Tech Lead', college: poc.college }).populate('college');
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

userSchema.methods.assignToCohort = async function (cohortId) {
  const originalCohortId = this.cohortId;
  this.cohortId = cohortId;
  await this.save();

  if (originalCohortId) {
    await this.constructor.model('Cohort').findByIdAndUpdate(originalCohortId, { $inc: { memberCount: -1 } });
  }
  if (cohortId) {
    await this.constructor.model('Cohort').findByIdAndUpdate(cohortId, { $inc: { memberCount: 1 } });
  }
};

userSchema.methods.removeFromCohort = async function () {
  const originalCohortId = this.cohortId;
  this.cohortId = null;
  await this.save();

  if (originalCohortId) {
    await this.constructor.model('Cohort').findByIdAndUpdate(originalCohortId, { $inc: { memberCount: -1 } });
  }
};

userSchema.statics.bulkUpdateWithValidation = async function (userIds, updateData) {
  const results = { successful: [], failed: [], skipped: [] };

  for (const userId of userIds) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        results.failed.push({ userId, error: 'User not found' });
        continue;
      }

      let needsUpdate = false;
      const changes = {};
      for (const key in updateData) {
        if (user[key] !== updateData[key]) {
          needsUpdate = true;
          changes[key] = updateData[key];
        }
      }

      if (!needsUpdate) {
        results.skipped.push({ userId, username: user.gitlabUsername, reason: 'No changes needed' });
        continue;
      }

      Object.assign(user, changes);
      user.sessionVersion += 1;
      const savedUser = await user.save();
      results.successful.push({ userId, username: savedUser.gitlabUsername, changes });

    } catch (error) {
      results.failed.push({ userId, error: error.message });
    }
  }

  return results;
};

export default mongoose.models.User || mongoose.model('User', userSchema);
