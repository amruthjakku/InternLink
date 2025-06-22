import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: Date,
    default: null
  },
  checkOut: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half_day'],
    default: 'absent'
  },
  workingHours: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    enum: ['office', 'remote', 'hybrid'],
    default: 'office'
  },
  ipAddress: {
    type: String
  },
  deviceInfo: {
    type: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isManualEntry: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure one attendance record per user per day
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// Indexes for better query performance
AttendanceSchema.index({ userId: 1 });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ status: 1 });

// Virtual for calculating working hours
AttendanceSchema.virtual('calculatedWorkingHours').get(function() {
  if (this.checkIn && this.checkOut) {
    const diffMs = this.checkOut - this.checkIn;
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Hours with 2 decimal places
  }
  return 0;
});

// Pre-save middleware to calculate working hours and status
AttendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const diffMs = this.checkOut - this.checkIn;
    this.workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    
    // Determine status based on check-in time and working hours
    const checkInHour = this.checkIn.getHours();
    const checkInMinute = this.checkIn.getMinutes();
    const checkInTime = checkInHour * 60 + checkInMinute; // Convert to minutes
    
    // Assuming work starts at 9:00 AM (540 minutes from midnight)
    const workStartTime = 9 * 60; // 9:00 AM in minutes
    const lateThreshold = workStartTime + 15; // 15 minutes late threshold
    
    if (this.workingHours >= 8) {
      this.status = checkInTime > lateThreshold ? 'late' : 'present';
    } else if (this.workingHours >= 4) {
      this.status = 'half_day';
    } else {
      this.status = 'present'; // Still present even if short hours
    }
  } else if (this.checkIn && !this.checkOut) {
    // Only check-in, assume still working
    this.status = 'present';
  }
  
  next();
});

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);