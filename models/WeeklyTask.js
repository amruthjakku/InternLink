import mongoose from 'mongoose';

const WeeklyTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  instructions: String,
  week: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['individual', 'cohort', 'all'],
    required: true,
  },
  cohort: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cohort',
  },
  assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  points: { type: Number, default: 10 },
  isPublished: { type: Boolean, default: false },
  dueDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
WeeklyTaskSchema.index({ week: 1, cohort: 1 });
WeeklyTaskSchema.index({ isPublished: 1, dueDate: 1 });

// Statics
WeeklyTaskSchema.statics.findForUser = function (user) {
  const query = {
    isPublished: true,
    $or: [
      { type: 'all' },
      { type: 'cohort', cohort: user.cohort },
      { type: 'individual', assignees: user._id },
    ],
  };
  return this.find(query).populate('createdBy', 'name');
};

export default mongoose.models.WeeklyTask || mongoose.model('WeeklyTask', WeeklyTaskSchema);
