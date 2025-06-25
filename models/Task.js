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
  type: {
    type: String,
    enum: ['assignment', 'project', 'quiz', 'presentation', 'research', 'coding', 'other'],
    default: 'assignment'
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'review', 'completed', 'done', 'draft', 'active', 'cancelled'],
    default: 'not_started'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    required: true
  },
  // Individual assignment (backward compatibility)
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assigneeName: {
    type: String
  },
  assigneeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Cohort assignment (new feature)
  cohortId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cohort'
  },
  cohortName: {
    type: String
  },
  // Assignment type: 'individual' or 'cohort'
  assignmentType: {
    type: String,
    enum: ['individual', 'cohort'],
    default: 'individual'
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
  assignedBy: {
    type: String // GitLab username
  },
  dueDate: {
    type: Date,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
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
  resources: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['link', 'file', 'document', 'video', 'tutorial']
    }
  }],
  requirements: [{
    description: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  submissions: [{
    internId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gitlabUsername: String,
    submittedAt: Date,
    submissionUrl: String,
    mergeRequestUrl: String,
    status: {
      type: String,
      enum: ['submitted', 'reviewed', 'approved', 'rejected', 'revision_needed'],
      default: 'submitted'
    },
    feedback: String,
    grade: {
      type: Number,
      min: 0,
      max: 100
    },
    reviewedBy: String,
    reviewedAt: Date
  }],
  // Task import/copy functionality
  originalTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  importedFrom: {
    cohortId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cohort'
    },
    cohortName: String,
    importedAt: Date,
    importedBy: String
  },
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
  }],
  isActive: {
    type: Boolean,
    default: true
  }
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