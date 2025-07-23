import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  type: {
    type: String,
    enum: ['direct', 'group', 'channel'],
    required: true,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// Indexes
chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ lastMessage: -1 });

// Methods
chatRoomSchema.methods.addParticipant = async function (userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    return this.save();
  }
};

chatRoomSchema.methods.removeParticipant = async function (userId) {
  this.participants.pull(userId);
  return this.save();
};

export default mongoose.models.ChatRoom || mongoose.model('ChatRoom', chatRoomSchema);
