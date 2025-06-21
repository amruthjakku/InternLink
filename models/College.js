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
  mentorUsername: {
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
collegeSchema.index({ name: 1 });
collegeSchema.index({ mentorUsername: 1 });
collegeSchema.index({ isActive: 1 });

// Virtual for mentor details
collegeSchema.virtual('mentor', {
  ref: 'User',
  localField: 'mentorUsername',
  foreignField: 'gitlabUsername',
  justOne: true
});

// Virtual for interns count
collegeSchema.virtual('internsCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'college',
  count: true,
  match: { role: 'intern', isActive: true }
});

// Ensure virtual fields are serialized
collegeSchema.set('toJSON', { virtuals: true });

// Pre-save middleware
collegeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
collegeSchema.statics.findByMentor = function(mentorUsername) {
  return this.findOne({ 
    mentorUsername: mentorUsername.toLowerCase(), 
    isActive: true 
  }).populate('mentor');
};

collegeSchema.statics.getAllActive = function() {
  return this.find({ isActive: true })
    .populate('mentor')
    .populate('internsCount');
};

// Instance methods
collegeSchema.methods.getInterns = function() {
  const User = mongoose.model('User');
  return User.find({ 
    college: this._id, 
    role: 'intern', 
    isActive: true 
  });
};

collegeSchema.methods.addIntern = function(internData) {
  const User = mongoose.model('User');
  return new User({
    ...internData,
    role: 'intern',
    college: this._id
  }).save();
};

export default mongoose.models.College || mongoose.model('College', collegeSchema);