import mongoose from 'mongoose';

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  website: {
    type: String,
    trim: true,
    default: ''
  },
  superMentorUsername: {
    type: String,
    required: false,
    trim: true,
    lowercase: true,
    default: 'unassigned'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true,
    trim: true
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

// Indexes
// Note: name already has unique index from schema definition
collegeSchema.index({ superMentorUsername: 1 });
collegeSchema.index({ isActive: 1 });

// Virtual for POC details
collegeSchema.virtual('poc', {
  ref: 'User',
  localField: 'superMentorUsername',
  foreignField: 'gitlabUsername',
  justOne: true
});

// Virtual for AI developer interns count
collegeSchema.virtual('aiDeveloperInternsCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'college',
  count: true,
  match: { role: 'AI developer Intern', isActive: true }
});

// Ensure virtual fields are serialized
collegeSchema.set('toJSON', { virtuals: true });

// Pre-save middleware
collegeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
collegeSchema.statics.findByPOC = function(pocUsername) {
  return this.findOne({ 
    superMentorUsername: pocUsername.toLowerCase(), 
    isActive: true 
  }).populate('superMentor');
};

collegeSchema.statics.getAllActive = function() {
  return this.find({ isActive: true })
    .populate('superMentor')
    .populate('aiDeveloperInternsCount');
};

// Instance methods
collegeSchema.methods.getAIDeveloperInterns = function() {
  const User = mongoose.model('User');
  return User.find({ 
    college: this._id, 
    role: 'AI developer Intern', 
    isActive: true 
  });
};

collegeSchema.methods.addAIDeveloperIntern = function(internData) {
  const User = mongoose.model('User');
  return new User({
    ...internData,
    role: 'AI developer Intern',
    college: this._id
  }).save();
};

export default mongoose.models.College || mongoose.model('College', collegeSchema);