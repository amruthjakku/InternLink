# InternLink Attendance System Guide

## Overview
InternLink features a comprehensive secure Wi-Fi-based attendance system that ensures attendance can only be marked from authorized networks using IP whitelisting validation. Both interns and mentors can mark attendance, which is reflected in the admin dashboard.

## 🔐 Security Features

### IP Whitelisting
- **Client-side IP Detection**: Uses `https://api.ipify.org?format=json` to fetch user's public IP
- **Server-side Validation**: Validates IP against authorized list stored in environment variables and database
- **Dual Storage**: IPs can be stored in `.env` file and MongoDB for flexibility
- **Real-time Blocking**: Unauthorized networks are immediately blocked with clear error messages

### Network Security
- Only authorized Wi-Fi networks can be used for attendance marking
- IP addresses are validated on every attendance request
- Comprehensive logging of all attendance attempts with IP tracking
- Device information capture for additional security

## 🔄 How It Works

### Step 1: Interns Mark Attendance
1. **Login as Intern** → Navigate to `/intern/dashboard`
2. **Find Attendance Widget** → "📍 Quick Attendance" section
3. **Click "Mark Attendance Now"** → System validates IP address
4. **Success Confirmation** → Shows timestamp, IP, and success message
5. **Data Stored** → Attendance record saved with user role "intern"

### Step 2: Mentors Mark Attendance
1. **Login as Mentor** → Navigate to `/mentor/dashboard`
2. **Find Attendance Widget** → "📍 Quick Attendance" section
3. **Click "Mark Attendance Now"** → System validates IP address
4. **Success Confirmation** → Shows timestamp, IP, and success message
5. **Data Stored** → Attendance record saved with user role "mentor"

### Step 3: Admin Views All Attendance
1. **Login as Admin** → Navigate to `/admin/dashboard`
2. **Click "Attendance Analytics" Tab** → Opens comprehensive dashboard
3. **View All Data** → See attendance from BOTH interns and mentors
4. **Filter by Role** → Choose "All", "Intern", or "Mentor"
5. **Real-time Updates** → New attendance appears immediately

## 📊 Admin Dashboard Features

### Attendance Analytics Tab
- **📈 Overview Stats**: Total users, present today, attendance rates
- **🔥 Heatmap View**: GitHub-style daily attendance visualization
- **👥 User Statistics**: Individual performance for all users
- **❌ Absentee List**: Who hasn't marked attendance (interns + mentors)
- **🏆 Top Performers**: Highest attendance rates across all roles
- **📊 Trends**: Weekly/monthly patterns for entire organization

### Filtering & Analysis
- **Role Filter**: View "All Users", "Interns Only", or "Mentors Only"
- **Date Range**: Custom date filtering for historical analysis
- **College Filter**: Filter by educational institution
- **Real-time Updates**: Live data as users mark attendance

### IP Management Tab
- **Add/Remove IPs**: Dynamic management of authorized IP addresses
- **IP Status Control**: Activate/deactivate IPs without deletion
- **Location Tracking**: Associate IPs with physical locations
- **Environment vs Database**: Distinguish between system and admin-managed IPs
- **Audit Trail**: Track who added/modified IP addresses and when

## 👥 User Features

### For Interns & Mentors

#### Quick Attendance Widget
- **One-click Marking**: Fast attendance marking from dashboard
- **Real-time Status**: Immediate feedback on attendance status
- **Weekly/Monthly Stats**: Quick overview of attendance performance
- **Streak Tracking**: Gamified streak counter with achievements
- **IP Display**: Shows current IP for transparency

#### Attendance History Tab
- **Personal History**: View your complete attendance record
- **Calendar View**: Monthly calendar with attendance status
- **Statistics**: Personal attendance rate and streak information
- **Export Options**: Download attendance records as CSV/Excel

### Check-in/Check-out System
- **Unified System**: Single button that toggles between check-in and check-out
- **Time Tracking**: Accurate time logging for work hours
- **Status Display**: Clear indication of current status (checked in/out)
- **Daily Summary**: Overview of total hours worked

## 🛠️ Technical Implementation

### API Endpoints
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/history` - Get attendance history
- `GET /api/attendance/stats` - Get attendance statistics
- `POST /api/admin/ip-management` - Manage authorized IPs

### Database Schema
```javascript
// Attendance Record
{
  userId: ObjectId,
  userRole: String, // 'intern', 'mentor', 'admin'
  timestamp: Date,
  ipAddress: String,
  location: String,
  deviceInfo: Object,
  type: String // 'checkin', 'checkout', 'attendance'
}

// Authorized IPs
{
  ipAddress: String,
  location: String,
  isActive: Boolean,
  addedBy: ObjectId,
  addedAt: Date,
  source: String // 'environment', 'admin'
}
```

### Environment Configuration
```bash
# .env file
AUTHORIZED_IPS=192.168.1.100,10.0.0.50,203.0.113.10
ATTENDANCE_TIMEZONE=Asia/Kolkata
ATTENDANCE_CUTOFF_TIME=23:59
```

## 🚨 Troubleshooting

### Common Issues

#### "IP Not Authorized" Error
- **Cause**: User trying to mark attendance from unauthorized network
- **Solution**: Admin needs to add the IP address to authorized list
- **Check**: Verify current IP at `/admin/dashboard` → IP Management tab

#### Attendance Not Showing
- **Cause**: Network connectivity or server issues
- **Solution**: Check internet connection and try again
- **Fallback**: Contact admin to manually mark attendance

#### Time Zone Issues
- **Cause**: Server and client time zone mismatch
- **Solution**: Configure `ATTENDANCE_TIMEZONE` in environment variables
- **Check**: Verify time display matches local time

### Admin Troubleshooting

#### Bulk Attendance Issues
- **Check Database**: Verify attendance records in MongoDB
- **IP Validation**: Ensure all required IPs are authorized
- **Server Logs**: Check application logs for errors
- **Network**: Verify server can access IP detection service

#### Performance Issues
- **Database Indexing**: Ensure proper indexes on attendance collection
- **Query Optimization**: Monitor slow queries in attendance analytics
- **Caching**: Implement caching for frequently accessed data
- **Load Balancing**: Consider load balancing for high traffic

## 📈 Analytics & Reporting

### Attendance Metrics
- **Daily Attendance Rate**: Percentage of users present each day
- **Weekly Trends**: Attendance patterns throughout the week
- **Monthly Analysis**: Long-term attendance trends
- **Role Comparison**: Attendance rates by user role

### Performance Indicators
- **Streak Analysis**: Longest and current attendance streaks
- **Punctuality**: On-time arrival statistics
- **Consistency**: Regular attendance pattern analysis
- **Improvement Tracking**: Month-over-month attendance improvements

### Export Options
- **CSV Export**: Download attendance data for external analysis
- **Excel Reports**: Formatted reports with charts and summaries
- **PDF Summaries**: Professional attendance reports
- **API Access**: Programmatic access to attendance data

## 🔧 Configuration Options

### Admin Settings
- **Attendance Window**: Set time window for valid attendance marking
- **Grace Period**: Allow late attendance marking with warnings
- **Notification Settings**: Configure attendance reminder notifications
- **Reporting Schedule**: Automated attendance report generation

### User Preferences
- **Notification Preferences**: Choose attendance reminder settings
- **Dashboard Layout**: Customize attendance widget display
- **Privacy Settings**: Control attendance data visibility
- **Export Preferences**: Set default export formats and schedules