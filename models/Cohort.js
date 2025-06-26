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
  maxInterns: {
    type: Number,
    default: 50
  },
  currentInterns: {
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

export default mongoose.models.Cohort || mongoose.model('Cohort', cohortSchema);