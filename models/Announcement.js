import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
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
    maxlength: 2000
  },
  priority: { 
    type: String, 
    enum: ['low', 'normal', 'high', 'urgent'], 
    default: 'normal' 
  },
  targetAudience: { 
    type: String, 
    enum: ['all', 'interns', 'mentors', 'tech-leads', 'pocs'], 
    default: 'all' 
  },
  scope: {
    type: String,
    enum: ['global', 'college'],
    default: 'college'
  },
  college: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'College',
    required: function() {
      return this.scope === 'college';
    }
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  expiresAt: {
    type: Date,
    default: null
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }]
}, {
  timestamps: true
});

// Indexes for better performance
announcementSchema.index({ college: 1, isActive: 1, createdAt: -1 });
announcementSchema.index({ scope: 1, isActive: 1, createdAt: -1 });
announcementSchema.index({ expiresAt: 1 });
announcementSchema.index({ targetAudience: 1 });

// Virtual for checking if announcement is expired
announcementSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Method to check if user has read the announcement
announcementSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.user.toString() === userId.toString());
};

// Method to mark as read by user
announcementSchema.methods.markAsReadBy = function(userId) {
  if (!this.isReadBy(userId)) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
  }
};

// Static method to get announcements for a user
announcementSchema.statics.getForUser = async function(userId, userRole, userCollege, options = {}) {
  const { limit = 20, skip = 0, includeRead = true } = options;
  
  const query = {
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  };

  // Scope filtering
  if (userRole === 'admin') {
    // Admins see all announcements
  } else {
    query.$or = [
      { scope: 'global' },
      { scope: 'college', college: userCollege }
    ];
  }

  // Audience filtering
  const audienceMap = {
    'AI Developer Intern': ['all', 'interns'],
    'Tech Lead': ['all', 'mentors', 'tech-leads'],
    'POC': ['all', 'mentors', 'pocs'],
    'admin': ['all', 'interns', 'mentors', 'tech-leads', 'pocs']
  };

  if (audienceMap[userRole]) {
    query.targetAudience = { $in: audienceMap[userRole] };
  }

  const announcements = await this.find(query)
    .populate('createdBy', 'name email role')
    .populate('college', 'name')
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip);

  return announcements;
};

const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);

export default Announcement;