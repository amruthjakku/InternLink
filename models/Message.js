import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text',
  },
  attachments: [{ name: String, url: String, type: String }],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  reactions: [{ emoji: String, users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] }],
  isDeleted: { type: Boolean, default: false },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, {
  timestamps: true,
});

// Indexes
messageSchema.index({ chatRoom: 1, createdAt: -1 });

// Methods
messageSchema.methods.toggleReaction = async function (userId, emoji) {
  const reaction = this.reactions.find(r => r.emoji === emoji);
  if (reaction) {
    const userIndex = reaction.users.indexOf(userId);
    if (userIndex > -1) {
      reaction.users.splice(userIndex, 1);
      if (reaction.users.length === 0) {
        this.reactions = this.reactions.filter(r => r.emoji !== emoji);
      }
    } else {
      reaction.users.push(userId);
    }
  } else {
    this.reactions.push({ emoji, users: [userId] });
  }
  return this.save();
};

messageSchema.methods.markAsRead = async function (userId) {
  if (!this.readBy.includes(userId)) {
    this.readBy.push(userId);
    return this.save();
  }
};

export default mongoose.models.Message || mongoose.model('Message', messageSchema);
