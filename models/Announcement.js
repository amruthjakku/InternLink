import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  targetRoles: {
    type: [String],
    enum: ['admin', 'POC', 'Tech Lead', 'AI Developer Intern'],
    default: [], // Empty array targets all roles
  },
  targetColleges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
  }], // Empty array targets all colleges (global)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
announcementSchema.index({ isActive: 1, expiresAt: 1 });
announcementSchema.index({ targetColleges: 1 });
announcementSchema.index({ targetRoles: 1 });

// Virtuals
announcementSchema.virtual('isExpired').get(function () {
  return this.expiresAt && this.expiresAt < new Date();
});

// Methods
announcementSchema.methods.markAsRead = async function (userId) {
  if (!this.readBy.some(r => r.user.equals(userId))) {
    this.readBy.push({ user: userId });
    return this.save();
  }
};

// Statics
announcementSchema.statics.findForUser = function (user) {
  const query = {
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  };

  if (user.role !== 'admin') {
    query.$and = [
      {
        $or: [
          { targetColleges: { $size: 0 } }, // Global announcement
          { targetColleges: user.college ? { $in: [user.college] } : { $size: 0 } } // Or targets user's college
        ]
      },
      {
        $or: [
          { targetRoles: { $size: 0 } }, // For all roles
          { targetRoles: { $in: [user.role] } } // Or for user's specific role
        ]
      }
    ];
  }

  return this.find(query)
    .populate('createdBy', 'name')
    .sort({ priority: -1, createdAt: -1 });
};

const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);

export default Announcement;
