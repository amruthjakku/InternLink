# AI developer InternLink Cohort Management Guide

## Overview
The cohort management system allows administrators to organize interns into cohorts and manage the relationship between cohorts and colleges. This feature provides comprehensive tools for cohort creation, college assignment, and bulk operations.

## 🏗️ System Architecture

### Data Model

#### Updated Cohort Schema
```javascript
{
  name: String,
  description: String,
  startDate: Date,
  endDate: Date,
  mentorId: ObjectId (ref: User),
  collegeId: ObjectId (ref: College), // Primary college association
  maxAI developer Interns: Number,
  currentAI developer Interns: Number,
  memberCount: Number,
  createdBy: String,
  isActive: Boolean
}
```

#### User-Cohort-College Relationship
- Users have both `college` and `cohortId` fields
- Cohorts can have a primary `collegeId`
- Multiple colleges can have users in the same cohort

## 🚀 Getting Started

### 1. Access the Feature
1. Login as admin/super-admin
2. Navigate to **Admin Dashboard**
3. Click **Cohort System** tab
4. Select **Colleges** sub-tab

### 2. View Current Assignments
- See all cohorts displayed as cards
- Click any cohort to view its college assignments
- View statistics: colleges count, interns, mentors, total users

## 📊 Features

### 1. Visual Cohort-College Management
- **Tab Location**: Admin Dashboard → Cohort System → Colleges Tab
- **Functionality**: 
  - View all active cohorts with their college assignments
  - Click on cohorts to see detailed college breakdown
  - Visual indicators for selected cohorts
  - Statistics for each cohort (colleges, interns, mentors, total users)

### 2. Individual College Assignment
- **Manual Assignment**: Select a cohort and manually assign/unassign colleges
- **Bulk Operations**: Assign multiple colleges to a cohort at once
- **Real-time Updates**: Changes reflect immediately in the UI

### 3. CSV/Excel Import System
- **Supported Formats**: CSV, Excel (.xlsx, .xls), and tab-separated files
- **Template Downloads**: Available in both CSV and Excel-compatible formats
- **File Upload**: Drag-and-drop or click to upload functionality
- **Manual Input**: Copy-paste CSV data directly into the interface

## 🔧 Manual Assignment Process

### Single Operations
1. Click on a cohort to select it
2. Click **"Manage Colleges"** button
3. Check/uncheck colleges to assign/unassign
4. Click **"Assign"** or **"Unassign"** button

### Bulk Operations
1. Select multiple cohorts using checkboxes
2. Choose colleges from the dropdown
3. Select action (assign/unassign)
4. Click **"Apply to Selected"** button

## 📥 Bulk Import Process

### Step 1: Get Current Data
Before importing, check your existing data:
- View cohorts in the dashboard to see exact names
- Go to **College Management** to see all college names
- Note: Names are **case-sensitive**

### Step 2: Download Template
1. Click **"Import CSV"** button
2. Download either:
   - **CSV Template** (recommended for most users)
   - **Excel Template** (tab-separated, for Excel users)

### Step 3: Prepare Your Data
Replace the example data with your real information:

```csv
cohortName,collegeName,action
"Winter 2024 Bootcamp","Stanford University","assign"
"Spring 2025 Program","MIT","assign"
"Summer 2024 Cohort","Harvard University","unassign"
```

### Step 4: Import
1. Either upload your CSV file OR copy-paste the data
2. Click **"Import"** button
3. Review the results for any errors

## 📋 File Format Requirements

### CSV Format (Recommended)
- Use commas to separate values
- Wrap text containing commas in quotes
- Supported file extensions: .csv

### Excel Format
- Tab-separated values work best
- Can be saved as .txt from Excel
- Use "Data > Text to Columns" when opening in Excel

### Required Columns
1. **cohortName** - Exact name of the cohort (case-sensitive)
2. **collegeName** - Exact name of the college (case-sensitive)  
3. **action** - Either "assign" or "unassign"

### Actions Explained
- **assign**: Assigns all unassigned users from the specified college to the specified cohort
- **unassign**: Removes all users from the specified college from the specified cohort

## ⚠️ Important Notes

### Data Validation
1. **Case Sensitivity**: Cohort and college names must match exactly
2. **Existing Data**: Only existing cohorts and colleges can be used
3. **User Status**: Only active users will be affected
4. **Validation**: Invalid entries will be skipped and reported
5. **Batch Processing**: All valid operations are processed together

### Best Practices
- Always download current data before making changes
- Use templates to ensure proper formatting
- Test with small batches before large imports
- Keep backups of your data before bulk operations
- Review import results carefully

## 🛠️ Technical Implementation

### API Endpoints
- `GET /api/admin/cohorts-colleges` - Fetch cohorts with college assignments
- `POST /api/admin/cohorts-colleges` - Assign/unassign colleges to/from cohorts
- `GET /api/admin/import-college-cohort` - Download import templates
- `POST /api/admin/import-college-cohort` - Bulk import college-cohort assignments

### Database Operations
```javascript
// Assign college to cohort
await User.updateMany(
  { college: collegeId, cohortId: null },
  { cohortId: cohortId }
);

// Unassign college from cohort
await User.updateMany(
  { college: collegeId, cohortId: cohortId },
  { cohortId: null }
);
```

### Import Processing
```javascript
// Process CSV data
const results = await Promise.all(
  csvData.map(async (row) => {
    try {
      const cohort = await Cohort.findOne({ name: row.cohortName });
      const college = await College.findOne({ name: row.collegeName });
      
      if (!cohort || !college) {
        return { success: false, error: 'Invalid cohort or college name' };
      }
      
      if (row.action === 'assign') {
        await assignCollegeToCohort(cohort._id, college._id);
      } else if (row.action === 'unassign') {
        await unassignCollegeFromCohort(cohort._id, college._id);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  })
);
```

## 📊 Analytics & Reporting

### Cohort Statistics
- **Member Count**: Total users in each cohort
- **College Distribution**: Number of colleges per cohort
- **Role Breakdown**: AI developer Interns, mentors, and admins per cohort
- **Activity Metrics**: Engagement and participation rates

### College Analytics
- **Cohort Participation**: Which cohorts each college participates in
- **User Distribution**: Number of users per college
- **Performance Metrics**: College-wise performance statistics
- **Engagement Tracking**: Activity levels by college

### Visual Reports
- **Cohort-College Matrix**: Visual representation of assignments
- **Distribution Charts**: Pie charts and bar graphs of distributions
- **Timeline Views**: Cohort lifecycle and milestone tracking
- **Comparison Reports**: Side-by-side cohort comparisons

## 🚨 Troubleshooting

### Common Issues

#### Import Failures
- **Invalid Names**: Ensure cohort and college names match exactly
- **File Format**: Check CSV formatting and column headers
- **Special Characters**: Handle quotes and commas properly
- **Empty Rows**: Remove empty rows from CSV files

#### Assignment Problems
- **User Not Found**: Verify users exist and are active
- **Permission Errors**: Check admin permissions
- **Database Conflicts**: Resolve data consistency issues
- **Validation Failures**: Address data validation errors

#### Performance Issues
- **Large Imports**: Break large imports into smaller batches
- **Database Locks**: Handle concurrent operations properly
- **Memory Usage**: Optimize data processing for large datasets
- **Timeout Issues**: Increase timeout limits for bulk operations

### Debugging Tools

#### Data Validation
```javascript
// Validate cohort-college assignment
const validateAssignment = async (cohortName, collegeName) => {
  const cohort = await Cohort.findOne({ name: cohortName });
  const college = await College.findOne({ name: collegeName });
  
  return {
    cohortExists: !!cohort,
    collegeExists: !!college,
    currentAssignments: cohort ? await getUsersInCohort(cohort._id) : []
  };
};
```

#### Import Testing
```javascript
// Test import data before processing
const testImportData = (csvData) => {
  const errors = [];
  const warnings = [];
  
  csvData.forEach((row, index) => {
    if (!row.cohortName) errors.push(`Row ${index + 1}: Missing cohort name`);
    if (!row.collegeName) errors.push(`Row ${index + 1}: Missing college name`);
    if (!['assign', 'unassign'].includes(row.action)) {
      errors.push(`Row ${index + 1}: Invalid action`);
    }
  });
  
  return { errors, warnings };
};
```

## 🔄 Maintenance & Updates

### Regular Maintenance
- **Data Cleanup**: Remove inactive cohorts and colleges
- **Performance Optimization**: Optimize database queries
- **Index Management**: Maintain proper database indexes
- **Backup Procedures**: Regular data backups

### System Updates
- **Schema Migrations**: Handle database schema changes
- **Feature Updates**: Deploy new cohort management features
- **Security Updates**: Apply security patches and updates
- **Performance Improvements**: Optimize system performance

### Monitoring
- **Usage Analytics**: Track feature usage and adoption
- **Error Monitoring**: Monitor and resolve system errors
- **Performance Metrics**: Track system performance indicators
- **User Feedback**: Collect and address user feedback