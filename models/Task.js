import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['assignment', 'project', 'quiz', 'other'],
    default: 'assignment',
  },
  status: {
    type: String,
    enum: ['draft', 'assigned', 'in_progress', 'in_review', 'completed', 'cancelled'],
    default: 'draft',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  cohort: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cohort',
  },
  assignmentType: {
    type: String,
    enum: ['individual', 'cohort'],
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  weekNumber: Number,
  points: { type: Number, default: 10 },
  tags: [String],
  attachments: [{ name: String, url: String }],
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// Indexes
TaskSchema.index({ status: 1, dueDate: 1 });
TaskSchema.index({ assignee: 1, status: 1 });
TaskSchema.index({ cohort: 1, status: 1 });
TaskSchema.index({ createdBy: 1 });

// Static Methods
TaskSchema.statics.findForUser = function (userId) {
  return this.find({ assignee: userId, isActive: true }).populate('category createdBy');
};

TaskSchema.statics.findForCohort = function (cohortId) {
  return this.find({ cohort: cohortId, isActive: true }).populate('category createdBy');
};

// Instance Methods
TaskSchema.methods.canBeEditedBy = async function (user) {
  if (user.role === 'admin') return true;

  const taskCreator = await mongoose.model('User').findById(this.createdBy);
  if (!taskCreator) return false;

  if (user.role === 'POC') {
    return user._id.equals(this.createdBy) || (taskCreator.role === 'Tech Lead' && user.college.equals(taskCreator.college));
  }

  if (user.role === 'Tech Lead') {
    return user._id.equals(this.createdBy);
  }

  return false;
};

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);