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
  superTech LeadUsername: {
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
collegeSchema.index({ superTech LeadUsername: 1 });
collegeSchema.index({ isActive: 1 });

// Virtual for POC details
collegeSchema.virtual('poc', {
  ref: 'User',
  localField: 'superTech LeadUsername',
  foreignField: 'gitlabUsername',
  justOne: true
});

// Virtual for AI developer interns count
collegeSchema.virtual('aiDeveloperAI Developer InternsCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'college',
  count: true,
  match: { role: 'AI Developer Intern', isActive: true }
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
    superTech LeadUsername: pocUsername.toLowerCase(), 
    isActive: true 
  }).populate('superTech Lead');
};

collegeSchema.statics.getAllActive = function() {
  return this.find({ isActive: true })
    .populate('superTech Lead')
    .populate('aiDeveloperAI Developer InternsCount');
};

// Instance methods
collegeSchema.methods.getAIDeveloperInterns = function() {
  const User = mongoose.model('User');
  return User.find({ 
    college: this._id, 
    role: 'AI Developer Intern', 
    isActive: true 
  });
};

collegeSchema.methods.addAIDeveloperIntern = function(internData) {
  const User = mongoose.model('User');
  return new User({
    ...internData,
    role: 'AI Developer Intern',
    college: this._id
  }).save();
};

export default mongoose.models.College || mongoose.model('College', collegeSchema);