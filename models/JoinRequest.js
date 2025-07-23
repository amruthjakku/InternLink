import mongoose from 'mongoose';

const joinRequestSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  intern: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Indexes
joinRequestSchema.index({ mentor: 1, intern: 1 }, { unique: true });
joinRequestSchema.index({ status: 1 });

export default mongoose.models.JoinRequest || mongoose.model('JoinRequest', joinRequestSchema);
