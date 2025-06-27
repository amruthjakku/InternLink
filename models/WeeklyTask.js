import mongoose from 'mongoose';

const WeeklyTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    default: ''
  },
  
  // Week organization
  weekNumber: {
    type: Number,
    required: true,
    min: 1
  },
  weekStartDate: {
    type: Date,
    required: true
  },
  weekEndDate: {
    type: Date,
    required: true
  },
  
  // Assignment details
  assignmentType: {
    type: String,
    enum: ['cohort', 'individual', 'all'],
    default: 'cohort'
  },
  cohortId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cohort',
    required: function() {
      return this.assignmentType === 'cohort';
    }
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Task properties
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  estimatedHours: {
    type: Number,
    min: 0.5,
    default: 2
  },
  points: {
    type: Number,
    default: 10
  },
  
  // Status and availability
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  autoActivate: {
    type: Boolean,
    default: true
  },
  activationDate: {
    type: Date,
    default: function() {
      return this.weekStartDate;
    }
  },
  dueDate: {
    type: Date,
    default: function() {
      return this.weekEndDate;
    }
  },
  
  // Resources and links
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['documentation', 'video', 'article', 'repository', 'other'],
      default: 'other'
    }
  }],
  
  // Requirements
  prerequisites: [String],
  deliverables: [String],
  
  // Grading
  gradingCriteria: [{
    criterion: String,
    points: Number,
    description: String
  }],
  maxScore: {
    type: Number,
    default: 100
  },
  
  // Metadata
  tags: [String],
  category: {
    type: String,
    enum: ['development', 'design', 'research', 'documentation', 'testing', 'deployment', 'other'],
    default: 'development'
  },
  
  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Statistics
  totalSubmissions: {
    type: Number,
    default: 0
  },
  completedSubmissions: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
WeeklyTaskSchema.index({ weekNumber: 1, cohortId: 1 });
WeeklyTaskSchema.index({ weekStartDate: 1, weekEndDate: 1 });
WeeklyTaskSchema.index({ isActive: 1, isPublished: 1 });
WeeklyTaskSchema.index({ assignmentType: 1, cohortId: 1 });

// Virtual for week display
WeeklyTaskSchema.virtual('weekLabel').get(function() {
  return `Week ${this.weekNumber}`;
});

// Virtual for status
WeeklyTaskSchema.virtual('currentStatus').get(function() {
  const now = new Date();
  if (now < this.weekStartDate) return 'upcoming';
  if (now > this.weekEndDate) return 'past';
  return 'current';
});

// Method to check if task should be visible to a user
WeeklyTaskSchema.methods.isVisibleTo = function(user) {
  if (!this.isActive || !this.isPublished) return false;
  
  // Check if it's the right time
  const now = new Date();
  if (this.autoActivate && now < this.activationDate) return false;
  
  // Check assignment
  if (this.assignmentType === 'all') return true;
  if (this.assignmentType === 'individual') {
    return this.assignedTo.includes(user._id);
  }
  if (this.assignmentType === 'cohort') {
    return user.cohortId && user.cohortId.toString() === this.cohortId.toString();
  }
  
  return false;
};

// Method to get tasks for a specific week and cohort
WeeklyTaskSchema.statics.getWeekTasks = async function(weekNumber, cohortId, userId) {
  const query = {
    weekNumber,
    isActive: true,
    isPublished: true,
    $or: [
      { assignmentType: 'all' },
      { assignmentType: 'cohort', cohortId },
      { assignmentType: 'individual', assignedTo: userId }
    ]
  };
  
  return this.find(query).sort({ createdAt: 1 });
};

// Method to get current week tasks
WeeklyTaskSchema.statics.getCurrentWeekTasks = async function(cohortId, userId) {
  const now = new Date();
  const query = {
    weekStartDate: { $lte: now },
    weekEndDate: { $gte: now },
    isActive: true,
    isPublished: true,
    $or: [
      { assignmentType: 'all' },
      { assignmentType: 'cohort', cohortId },
      { assignmentType: 'individual', assignedTo: userId }
    ]
  };
  
  return this.find(query).sort({ createdAt: 1 });
};

const WeeklyTask = mongoose.models.WeeklyTask || mongoose.model('WeeklyTask', WeeklyTaskSchema);

export default WeeklyTask;