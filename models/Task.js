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
    enum: ['admin', 'POC', 'Tech Lead'],
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
  // Week organization for better task management
  weekNumber: {
    type: Number,
    min: 1,
    max: 52
  },
  // Points system for gamification
  points: {
    type: Number,
    default: 10,
    min: 0
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
  
  // GitLab template repository
  gitlabTemplateRepo: {
    url: String,
    projectId: Number,
    description: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  // Verification requirements
  verificationLevel: {
    type: String,
    enum: ['none', 'simple', 'strict'],
    default: 'none'
  },
  
  // Keywords for repository matching
  matchKeywords: [{
    type: String,
    trim: true
  }],
  requirements: [{
    description: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  // Subtasks for better task breakdown
  subtasks: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    estimatedHours: {
      type: Number,
      default: 0
    },
    actualHours: {
      type: Number,
      default: 0
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  submissions: [{
    aiDeveloperInternId: {
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
  timeTracking: [{
    date: {
      type: Date,
      default: Date.now
    },
    hours: {
      type: Number,
      required: true
    },
    description: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
TaskSchema.index({ cohortId: 1 }); // Add index for cohort-based queries
TaskSchema.index({ assignmentType: 1 }); // Add index for assignment type
TaskSchema.index({ weekNumber: 1 }); // Add index for week-based queries

// Instance methods
TaskSchema.methods.canBeEditedBy = function(user) {
  // Admin can edit all tasks
  if (user.role === 'admin') return true;
  
  // POC can edit tasks they created or tasks created by Tech Leads in their college
  if (user.role === 'POC') {
    if (this.createdBy.toString() === user._id.toString()) return true;
    if (this.createdByRole === 'Tech Lead') {
      // Check if the task creator is in the same college (would need to populate createdBy)
      return true; // For now, allow POCs to edit Tech Lead tasks
    }
    return false;
  }
  
  // Tech Leads can only edit tasks they created (not admin/POC created tasks)
  if (user.role === 'Tech Lead') {
    return this.createdBy.toString() === user._id.toString() && this.createdByRole === 'Tech Lead';
  }
  
  return false;
};

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);