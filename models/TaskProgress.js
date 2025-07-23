import mongoose from 'mongoose';

const TaskProgressSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  intern: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'in_review', 'completed', 'cancelled'],
    default: 'not_started',
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  submission: {
    url: String,
    submittedAt: Date,
  },
  review: {
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    feedback: String,
    grade: { type: Number, min: 0, max: 100 },
  },
  pointsEarned: { type: Number, default: 0 },
  timeLogs: [{
    date: { type: Date, default: Date.now },
    hours: { type: Number, required: true },
    description: String,
  }],
  notes: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  needsHelp: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// Indexes
TaskProgressSchema.index({ task: 1, intern: 1 }, { unique: true });
TaskProgressSchema.index({ intern: 1, status: 1 });

// Methods
TaskProgressSchema.methods.logTime = function (hours, description = '') {
  this.timeLogs.push({ hours, description });
  return this.save();
};

TaskProgressSchema.methods.requestHelp = function (message) {
  this.needsHelp = true;
  if (message) {
    this.notes.push({ content: message, author: this.intern });
  }
  return this.save();
};

// Statics
TaskProgressSchema.statics.findOrCreateFor = async function (taskId, internId) {
  return this.findOneAndUpdate(
    { task: taskId, intern: internId },
    { $setOnInsert: { task: taskId, intern: internId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export default mongoose.models.TaskProgress || mongoose.model('TaskProgress', TaskProgressSchema);
