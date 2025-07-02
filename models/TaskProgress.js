import mongoose from 'mongoose';

const TaskProgressSchema = new mongoose.Schema({
  // Reference to the task
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  
  // Reference to the intern
  internId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Progress tracking
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'review', 'completed', 'done'],
    default: 'not_started'
  },
  
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Time tracking
  actualHours: {
    type: Number,
    default: 0
  },
  
  startedAt: {
    type: Date,
    default: null
  },
  
  completedAt: {
    type: Date,
    default: null
  },
  
  // Submission details
  submissionUrl: {
    type: String,
    default: null
  },
  
  submissionNotes: {
    type: String,
    default: null
  },
  
  // GitLab repository details
  repoUrl: {
    type: String,
    default: null
  },
  
  submissionMethod: {
    type: String,
    enum: ['auto', 'manual', 'template'],
    default: 'manual'
  },
  
  verified: {
    type: Boolean,
    default: false
  },
  
  submittedOn: {
    type: Date,
    default: null
  },
  
  matchConfidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  matchMethod: {
    type: String,
    enum: ['name_match', 'readme_match', 'file_structure', 'task_json', 'manual', 'template'],
    default: null
  },
  
  // Review and feedback
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  reviewedAt: {
    type: Date,
    default: null
  },
  
  feedback: {
    type: String,
    default: null
  },
  
  grade: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  
  // Points earned (can be different from task.points based on performance)
  pointsEarned: {
    type: Number,
    default: 0
  },
  
  // Subtask progress tracking
  subtaskProgress: [{
    subtaskId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    },
    actualHours: {
      type: Number,
      default: 0
    }
  }],
  
  // Time logs for this intern's work on this task
  timeLogs: [{
    date: {
      type: Date,
      default: Date.now
    },
    hours: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      default: ''
    }
  }],
  
  // Comments/notes specific to this intern's progress
  notes: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Flags
  isActive: {
    type: Boolean,
    default: true
  },
  
  needsHelp: {
    type: Boolean,
    default: false
  },
  
  helpRequestedAt: {
    type: Date,
    default: null
  },
  
  helpMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound index to ensure one progress record per intern per task
TaskProgressSchema.index({ taskId: 1, internId: 1 }, { unique: true });

// Additional indexes for performance
TaskProgressSchema.index({ internId: 1, status: 1 });
TaskProgressSchema.index({ taskId: 1, status: 1 });
TaskProgressSchema.index({ completedAt: 1 });
TaskProgressSchema.index({ pointsEarned: 1 });

// Instance methods
TaskProgressSchema.methods.markAsStarted = function() {
  if (this.status === 'not_started') {
    this.status = 'in_progress';
    this.startedAt = new Date();
    this.progress = Math.max(this.progress, 10); // Minimum 10% when started
  }
  return this.save();
};

TaskProgressSchema.methods.markAsCompleted = function(pointsEarned = null) {
  this.status = 'completed';
  this.progress = 100;
  this.completedAt = new Date();
  
  // If points earned is not specified, use the task's default points
  if (pointsEarned !== null) {
    this.pointsEarned = pointsEarned;
  } else if (this.pointsEarned === 0) {
    // Get the task's points if not already set
    return this.populate('taskId').then(populated => {
      this.pointsEarned = populated.taskId.points || 10;
      return this.save();
    });
  }
  
  return this.save();
};

TaskProgressSchema.methods.updateProgress = function(progressPercent) {
  this.progress = Math.max(0, Math.min(100, progressPercent));
  
  // Auto-update status based on progress
  if (this.progress === 0) {
    this.status = 'not_started';
  } else if (this.progress === 100) {
    this.status = 'completed';
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else if (this.progress >= 90) {
    this.status = 'review';
  } else if (this.progress > 0) {
    this.status = 'in_progress';
    if (!this.startedAt) {
      this.startedAt = new Date();
    }
  }
  
  return this.save();
};

TaskProgressSchema.methods.addTimeLog = function(hours, description = '') {
  this.timeLogs.push({
    hours,
    description,
    date: new Date()
  });
  
  // Update total actual hours
  this.actualHours = this.timeLogs.reduce((total, log) => total + log.hours, 0);
  
  return this.save();
};

TaskProgressSchema.methods.requestHelp = function(message) {
  this.needsHelp = true;
  this.helpRequestedAt = new Date();
  this.helpMessage = message;
  return this.save();
};

TaskProgressSchema.methods.resolveHelp = function() {
  this.needsHelp = false;
  this.helpRequestedAt = null;
  this.helpMessage = null;
  return this.save();
};

// Static methods
TaskProgressSchema.statics.findOrCreateProgress = async function(taskId, internId) {
  let progress = await this.findOne({ taskId, internId });
  
  if (!progress) {
    progress = new this({
      taskId,
      internId,
      status: 'not_started',
      progress: 0
    });
    await progress.save();
  }
  
  return progress;
};

TaskProgressSchema.statics.getInternProgress = function(internId, options = {}) {
  const query = { internId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.taskIds) {
    query.taskId = { $in: options.taskIds };
  }
  
  return this.find(query)
    .populate('taskId', 'title description category points dueDate')
    .sort({ updatedAt: -1 });
};

TaskProgressSchema.statics.getTaskProgress = function(taskId, options = {}) {
  const query = { taskId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('internId', 'name email gitlabUsername')
    .sort({ updatedAt: -1 });
};

TaskProgressSchema.statics.getCompletedTasksForIntern = function(internId, dateFilter = {}) {
  const query = {
    internId,
    status: { $in: ['completed', 'done'] },
    ...dateFilter
  };
  
  return this.find(query)
    .populate('taskId', 'title description category points')
    .sort({ completedAt: -1 });
};

TaskProgressSchema.statics.calculateInternStats = async function(internId, dateFilter = {}) {
  const query = { internId, ...dateFilter };
  
  const allProgress = await this.find(query).populate('taskId', 'points');
  const completedProgress = allProgress.filter(p => ['completed', 'done'].includes(p.status));
  
  const totalTasks = allProgress.length;
  const completedTasks = completedProgress.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalPoints = completedProgress.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);
  const totalHours = allProgress.reduce((sum, p) => sum + (p.actualHours || 0), 0);
  
  return {
    totalTasks,
    completedTasks,
    completionRate,
    totalPoints,
    totalHours: Math.round(totalHours * 10) / 10
  };
};

export default mongoose.models.TaskProgress || mongoose.model('TaskProgress', TaskProgressSchema);