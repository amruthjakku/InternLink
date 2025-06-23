import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['general', 'project', 'announcement', 'support', 'social'],
    default: 'general'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'college-only'],
    default: 'public'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: function() {
      return this.visibility === 'college-only';
    }
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    allowMentions: {
      type: Boolean,
      default: true
    },
    moderationEnabled: {
      type: Boolean,
      default: false
    },
    maxParticipants: {
      type: Number,
      default: 100
    }
  },
  tags: [String],
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
chatRoomSchema.index({ createdBy: 1 });
chatRoomSchema.index({ college: 1 });
chatRoomSchema.index({ type: 1 });
chatRoomSchema.index({ visibility: 1 });
chatRoomSchema.index({ 'participants.user': 1 });
chatRoomSchema.index({ isActive: 1, lastActivity: -1 });

// Virtual for participant count
chatRoomSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Method to add participant
chatRoomSchema.methods.addParticipant = function(userId, role = 'member') {
  const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      role: role,
      joinedAt: new Date(),
      lastSeen: new Date()
    });
  }
  return this.save();
};

// Method to remove participant
chatRoomSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.user.toString() !== userId.toString());
  return this.save();
};

// Method to update last activity
chatRoomSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

export default mongoose.models.ChatRoom || mongoose.model('ChatRoom', chatRoomSchema);