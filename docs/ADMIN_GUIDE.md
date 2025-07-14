# InternLink Admin Guide

## Overview
This comprehensive guide covers all administrative features and capabilities in InternLink, including user management, system monitoring, and advanced analytics.

## 🏗️ Admin System Architecture

### Role Hierarchy
```
ADMIN (Super User)
├── Can add other Admins (by GitLab username)
├── Can add/manage Mentors
├── Can create/manage Colleges
├── System-wide oversight
└── Full platform control

MENTOR (College-specific)
├── Can add Interns (only for their college)
├── Can manage their college's cohorts
├── Can monitor their interns' progress
└── College-scoped permissions

INTERN (Auto-assigned)
├── Automatically gets intern role on first login
├── Must be pre-added by their mentor
├── Can only access their assigned college/cohort
└── View-only permissions
```

## 🚀 Getting Started

### 1. Bootstrap First Admin

#### Using Node.js Script (Recommended)
```bash
cd nextjs-app
node scripts/create-admin.js --gitlab-username=amruthjakku --name="Amruth Jakku" --email="amruth@example.com"
```

#### Using Python Script
```bash
cd nextjs-app/scripts
pip install -r requirements.txt
python create_admin.py --gitlab_username=amruthjakku --name="Amruth Jakku" --email="amruth@example.com"
```

### 2. Start the Application
```bash
npm run dev
```

## 📊 Admin Dashboard Features

### ✅ Currently Implemented
- Basic admin dashboard with overview stats
- User management (CRUD operations)
- College management (CRUD operations)
- Bulk import/export functionality
- System overview with metrics
- Basic authentication and role-based access

### 🔧 Core Admin Functions

#### User Management
- **Create Users**: Add new interns, mentors, and admins
- **Edit User Details**: Update user information and roles
- **Delete Users**: Remove users from the system
- **Role Assignment**: Assign and modify user roles
- **Bulk Operations**: Import/export users via CSV/Excel

#### College Management
- **Add Colleges**: Create new college entries
- **Edit College Info**: Update college details
- **Delete Colleges**: Remove colleges and reassign users
- **College Analytics**: View college-specific metrics

#### System Monitoring
- **User Activity**: Track login patterns and usage
- **System Health**: Monitor server performance
- **Error Tracking**: View and resolve system errors
- **Usage Statistics**: Analyze platform utilization

## 🗑️ Bulk Delete Feature

### Multi-Selection System
- **☑️ Individual Checkboxes**: Each task card has a selection checkbox
- **☑️ Select All**: Master checkbox to select/deselect all visible tasks
- **🎯 Visual Feedback**: Selected tasks are highlighted in blue with border and background
- **📊 Selection Counter**: Shows "3 selected" or "5 of 12 tasks selected"

### Bulk Actions Bar
- **🗑️ Delete Selected Button**: Appears when tasks are selected
- **📈 Dynamic Counter**: Shows exact number of selected tasks
- **❌ Cancel Button**: Clear selections without deleting
- **🔄 Auto-hide**: Bar disappears when no tasks are selected

### Smart Deletion Process
- **⚠️ Confirmation Dialog**: "Are you sure you want to delete 5 tasks?"
- **🚀 Parallel Processing**: Deletes multiple tasks simultaneously
- **📊 Success Feedback**: "Successfully deleted 5 tasks!"
- **🛡️ Error Handling**: Shows failures and successful deletions separately
- **🔄 Auto-refresh**: Updates task list after deletion

### Enhanced User Experience
- **🎨 Visual Selection**: Blue highlight for selected tasks
- **💡 Help Section**: Instructions on how to use bulk actions
- **⌨️ Intuitive Interface**: Clear labels and visual cues
- **🧹 Auto-cleanup**: Resets selections after operations

## 🔐 Security & Permissions

### Access Control
- **Role-based Access**: Different permissions for each role
- **College Scoping**: Mentors can only access their college data
- **Admin Privileges**: Full system access for administrators
- **Audit Logging**: Track all administrative actions

### Data Protection
- **User Isolation**: Users can only access their authorized data
- **Secure Authentication**: GitLab OAuth integration
- **Permission Validation**: Server-side permission checks
- **Data Encryption**: Secure data storage and transmission

## 📈 Analytics & Reporting

### User Analytics
- **Active Users**: Track daily/weekly/monthly active users
- **User Growth**: Monitor user registration trends
- **Engagement Metrics**: Analyze user interaction patterns
- **Performance Tracking**: Monitor user task completion rates

### System Analytics
- **Server Performance**: CPU, memory, and response time monitoring
- **Database Performance**: Query optimization and slow query detection
- **Error Rates**: Track and analyze system errors
- **Usage Patterns**: Identify peak usage times and bottlenecks

## 🛠️ Advanced Features

### Bulk Import/Export
- **CSV Support**: Import/export users and colleges via CSV
- **Excel Support**: Full Excel file compatibility
- **Template Downloads**: Pre-formatted templates for data import
- **Validation**: Data validation during import process
- **Error Reporting**: Detailed error reports for failed imports

### System Configuration
- **Environment Settings**: Configure system-wide settings
- **Feature Toggles**: Enable/disable specific features
- **Maintenance Mode**: System maintenance and updates
- **Backup Management**: Database backup and restore

## 🚨 Troubleshooting

### Common Issues
1. **User Login Problems**: Check GitLab OAuth configuration
2. **Permission Errors**: Verify user roles and permissions
3. **Import Failures**: Validate CSV/Excel file format
4. **Performance Issues**: Monitor system resources and database queries

### Support Resources
- **Error Logs**: Check application logs for detailed error information
- **System Health**: Use admin dashboard monitoring tools
- **Database Tools**: Direct database access for advanced troubleshooting
- **Documentation**: Refer to technical documentation for specific issues

## 📞 Admin Support

For technical support and advanced configuration:
- Check system logs in `/logs` directory
- Monitor database performance via admin dashboard
- Contact system administrator for critical issues
- Refer to deployment guide for infrastructure problems