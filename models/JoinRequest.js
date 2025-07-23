import mongoose from 'mongoose';

const joinRequestSchema = new mongoose.Schema({
  mentorId: {
    type: String,
    required: true
  },
  internId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedAt: {
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

// Indexes
joinRequestSchema.index({ mentorId: 1 });
joinRequestSchema.index({ internId: 1 });
joinRequestSchema.index({ status: 1 });

export default mongoose.models.JoinRequest || mongoose.model('JoinRequest', joinRequestSchema);