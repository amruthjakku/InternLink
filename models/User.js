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
  }
}, {
  timestamps: true
});

// Indexes for better performance
// Note: gitlabUsername and gitlabId already have unique indexes from schema definition
userSchema.index({ role: 1 });
userSchema.index({ college: 1 });
userSchema.index({ assignedMentor: 1 });

// Virtual for college name (populated)
userSchema.virtual('collegeName', {
  ref: 'College',
  localField: 'college',
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
  if (populateFields) {
    mongooseQuery = mongooseQuery.populate(populateFields);
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

export default mongoose.models.User || mongoose.model('User', userSchema);