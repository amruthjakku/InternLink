import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#3B82F6'
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
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
categorySchema.index({ name: 1, createdBy: 1 }, { unique: true });
categorySchema.index({ isActive: 1 });

// Pre-save hook
categorySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Category || mongoose.model('Category', categorySchema);