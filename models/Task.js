import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'review', 'completed', 'done'],
    default: 'not_started'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: {
    type: String,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assigneeName: {
    type: String,
    required: true
  },
  assigneeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByRole: {
    type: String,
    enum: ['admin', 'super-mentor', 'mentor'],
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  estimatedHours: {
    type: Number,
    default: 0
  },
  actualHours: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ createdBy: 1 });
TaskSchema.index({ createdByRole: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ category: 1 });

// Instance methods
TaskSchema.methods.canBeEditedBy = function(user) {
  // Admin can edit all tasks
  if (user.role === 'admin') return true;
  
  // Super-mentor can edit tasks they created or tasks created by mentors in their college
  if (user.role === 'super-mentor') {
    if (this.createdBy.toString() === user._id.toString()) return true;
    if (this.createdByRole === 'mentor') {
      // Check if the task creator is in the same college (would need to populate createdBy)
      return true; // For now, allow super-mentors to edit mentor tasks
    }
    return false;
  }
  
  // Mentors can only edit tasks they created (not admin/super-mentor created tasks)
  if (user.role === 'mentor') {
    return this.createdBy.toString() === user._id.toString() && this.createdByRole === 'mentor';
  }
  
  return false;
};

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);