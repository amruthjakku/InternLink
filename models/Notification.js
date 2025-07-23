import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  type: {
    type: String,
    required: true,
    enum: [
      'task_assigned',
      'task_completed',
      'task_overdue',
      'help_request',
      'help_response',
      'announcement',
      'attendance_reminder',
      'performance_update',
      'system_notification',
      'gitlab_sync',
      'cohort_update',
      'admin_message'
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['task', 'system', 'admin', 'social', 'performance'],
    default: 'system'
  },
  actionUrl: {
    type: String,
    default: null
  },
  actionText: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, read: 1 });
notificationSchema.index({ expiresAt: 1 }, { sparse: true });

// Update the updatedAt field before saving
notificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static methods for common operations
notificationSchema.statics.createNotification = async function(data) {
  try {
    const notification = new this(data);
    await notification.save();
    return notification;
  } catch (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }
};

notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  try {
    const result = await this.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true, readAt: new Date() },
      { new: true }
    );
    return result;
  } catch (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
};

notificationSchema.statics.markAllAsRead = async function(userId) {
  try {
    const result = await this.updateMany(
      { recipient: userId, read: false },
      { read: true, readAt: new Date() }
    );
    return result;
  } catch (error) {
    throw new Error(`Failed to mark all notifications as read: ${error.message}`);
  }
};

notificationSchema.statics.getUnreadCount = async function(userId) {
  try {
    const count = await this.countDocuments({
      recipient: userId,
      read: false,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });
    return count;
  } catch (error) {
    throw new Error(`Failed to get unread count: ${error.message}`);
  }
};

notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    read = null,
    type = null,
    priority = null
  } = options;

  try {
    const query = { recipient: userId };
    
    // Filter expired notifications
    query.$or = [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ];
    
    if (read !== null) {
      query.read = read;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (priority) {
      query.priority = priority;
    }

    const notifications = await this.find(query)
      .populate('sender', 'name gitlabUsername')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await this.countDocuments(query);

    return {
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  } catch (error) {
    throw new Error(`Failed to get user notifications: ${error.message}`);
  }
};

// Clean up expired notifications
notificationSchema.statics.cleanupExpired = async function() {
  try {
    const result = await this.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    return result.deletedCount;
  } catch (error) {
    throw new Error(`Failed to cleanup expired notifications: ${error.message}`);
  }
};

// Virtual for formatted creation date
notificationSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleString();
});

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return this.createdAt.toLocaleDateString();
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;