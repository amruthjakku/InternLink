import mongoose from 'mongoose';

const cohortSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  techLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
  },
  maxInterns: {
    type: Number,
    default: 50,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
cohortSchema.index({ name: 1, college: 1 }, { unique: true });
cohortSchema.index({ techLead: 1 });
cohortSchema.index({ isActive: 1, startDate: -1 });

// Virtuals
cohortSchema.virtual('members', {
  ref: 'User',
  localField: '_id',
  foreignField: 'cohortId',
});

cohortSchema.virtual('memberCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'cohortId',
  count: true,
});

// Static Methods
cohortSchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort({ startDate: -1 }).populate('techLead college');
};

cohortSchema.statics.assignUsersToCohort = async function (cohortId, userIds) {
  const User = this.model('User');
  await User.updateMany({ _id: { $in: userIds } }, { $set: { cohortId } });
  return { success: true, message: `${userIds.length} users assigned to cohort.` };
};

cohortSchema.statics.removeUsersFromCohort = async function (cohortId, userIds) {
  const User = this.model('User');
  await User.updateMany({ _id: { $in: userIds }, cohortId }, { $unset: { cohortId: '' } });
  return { success: true, message: `${userIds.length} users removed from cohort.` };
};

export default mongoose.models.Cohort || mongoose.model('Cohort', cohortSchema);
