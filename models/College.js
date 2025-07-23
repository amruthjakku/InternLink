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
  poc: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true
});

// Indexes
collegeSchema.index({ name: 1 }, { unique: true });
collegeSchema.index({ poc: 1 });

// Virtuals
collegeSchema.virtual('internCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'college',
  count: true,
  match: { role: 'AI Developer Intern', isActive: true },
});

// Ensure virtual fields are serialized
collegeSchema.set('toJSON', { virtuals: true });

// Pre-save middleware
collegeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

collegeSchema.statics.findByPoc = async function (pocId) {
  return this.find({ poc: pocId, isActive: true }).populate('poc');
};

collegeSchema.statics.getAllActive = async function () {
  return this.find({ isActive: true }).populate('poc').populate('internCount');
};

// Instance methods
collegeSchema.methods.getInterns = function () {
  return this.model('User').find({ college: this._id, role: 'AI Developer Intern', isActive: true });
};


export default mongoose.models.College || mongoose.model('College', collegeSchema);