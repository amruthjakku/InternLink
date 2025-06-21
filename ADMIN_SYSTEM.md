# Admin-Controlled Role System

This document describes the new admin-controlled role assignment system for the Internship Tracker platform.

## 🏗️ System Architecture

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

### 3. Login as Admin
- Go to the homepage
- Click "Get Started" or "Sign In"
- Login with your GitLab account
- You'll be automatically recognized as an admin

## 📋 User Flow Examples

### 🛠️ First-Time Setup
1. **Bootstrap Admin**: Run the admin creation script
2. **Admin Login**: First admin logs in via GitLab OAuth
3. **Add Colleges**: Admin creates colleges and assigns mentors
4. **Add Mentors**: Admin adds mentor users by GitLab username
5. **Mentor Login**: Mentors log in and get access to their college
6. **Add Interns**: Mentors add intern users by GitLab username
7. **Intern Login**: Interns log in and get access to their dashboard

### 👤 New Admin Joins
1. **Existing Admin**: Uses admin dashboard → "Add User"
2. **Set Role**: Assigns `role = admin` to GitLab username
3. **New Admin Login**: When they log in via GitLab OAuth → auto-detected as admin

### 👨‍🏫 Mentor Onboarding
1. **Admin Action**: Admin assigns `gitlab_username = mentor_ashok` → `role = mentor` → `college = "ABC Institute"`
2. **Mentor Login**: When `mentor_ashok` logs in → role auto-detected → access to mentor dashboard
3. **College Access**: Mentor can only manage their assigned college

### 🧑‍💻 Intern Onboarding
1. **Mentor Action**: Mentor of "ABC Institute" adds `gitlab_username = intern_devi01`
2. **Auto-Assignment**: System automatically assigns `role = intern` and `college = "ABC Institute"`
3. **Intern Login**: When `intern_devi01` logs in → role auto-detected → access to intern dashboard

## 🗃️ Database Schema

### Users Collection
```javascript
{
  "gitlabUsername": "amruthjakku",        // Unique GitLab username
  "gitlabId": "12345678",                 // GitLab user ID
  "name": "Amruth Jakku",                 // Full name
  "email": "amruth@example.com",          // Email address
  "role": "admin",                        // "admin", "mentor", or "intern"
  "college": ObjectId("..."),             // Reference to college (null for admins)
  "assignedBy": "admin_username",         // Who added this user
  "isActive": true,                       // Soft delete flag
  "profileImage": "https://...",          // GitLab avatar URL
  "lastLoginAt": "2024-01-15T10:30:00Z",  // Last login timestamp
  "createdAt": "2024-01-01T00:00:00Z",    // Creation timestamp
  "updatedAt": "2024-01-15T10:30:00Z"     // Last update timestamp
}
```

### Colleges Collection
```javascript
{
  "name": "ABC Institute",               // College name
  "description": "Premier engineering...", // Description
  "location": "Hyderabad, India",        // Location
  "website": "https://abc.edu.in",       // Website URL
  "mentorUsername": "mentor_ashok",      // Assigned mentor's GitLab username
  "isActive": true,                      // Soft delete flag
  "createdBy": "admin_username",         // Admin who created this college
  "createdAt": "2024-01-01T00:00:00Z",   // Creation timestamp
  "updatedAt": "2024-01-01T00:00:00Z"    // Last update timestamp
}
```

## 🔐 Security Features

### Access Control
- **Pre-Registration Required**: All users must be pre-registered by authorized personnel
- **Role-Based Permissions**: Each role has specific capabilities and restrictions
- **College Scoping**: Mentors and interns are restricted to their assigned college
- **GitLab OAuth**: Secure authentication using GitLab accounts

### Permission Matrix
| Action | Admin | Mentor | Intern |
|--------|-------|--------|--------|
| Add Admins | ✅ | ❌ | ❌ |
| Add Mentors | ✅ | ❌ | ❌ |
| Create Colleges | ✅ | ❌ | ❌ |
| Add Interns | ✅ | ✅ (own college) | ❌ |
| View All Users | ✅ | ❌ | ❌ |
| View College Users | ✅ | ✅ (own college) | ✅ (own college) |
| Manage GitLab Integration | ✅ | ✅ | ✅ |
| View Analytics | ✅ | ✅ (own college) | ✅ (own data) |

## 🔧 API Endpoints

### Admin APIs
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - All users list
- `POST /api/admin/users` - Add new user
- `DELETE /api/admin/users/[id]` - Delete user
- `GET /api/admin/colleges` - All colleges list
- `POST /api/admin/colleges` - Add new college

### Mentor APIs
- `GET /api/mentor/interns` - Interns in mentor's college
- `POST /api/mentor/interns` - Add new intern
- `GET /api/mentor/analytics` - College analytics

### Authentication
- `POST /api/auth/signin` - GitLab OAuth login
- `GET /api/auth/session` - Current session info

## 🚨 Error Handling

### Unauthorized Access
When an unregistered user tries to log in:
```
Error: "Your GitLab account is not yet registered. Contact your mentor/admin."
Redirect: /auth/error?error=AccessDenied
```

### Edge Cases
1. **Mentor Tries to Add Intern from Other College**: Blocked with validation error
2. **Username Change on GitLab**: Use GitLab user ID for robustness
3. **Duplicate College Assignment**: Prevent mentor from being assigned to multiple colleges
4. **Self-Deletion**: Prevent admin from deleting their own account

## 🎯 Dashboard Features

### Admin Dashboard
- **Overview**: System statistics and recent activity
- **User Management**: Add/remove users, view all users
- **College Management**: Create colleges, assign mentors
- **System Settings**: Database status, configuration

### Mentor Dashboard
- **College Overview**: Intern statistics and progress
- **Intern Management**: Add interns, view progress
- **Analytics**: College-specific GitLab analytics
- **Team Activity**: Monitor intern development

### Intern Dashboard
- **Progress Tracking**: Personal development metrics
- **GitLab Integration**: Commits, issues, merge requests
- **Task Management**: Assigned tasks and deadlines
- **Analytics**: Personal GitLab activity

## 🔄 Migration from Demo System

### Data Cleanup
1. **Remove Demo Data**: Clear all mock users, tasks, and colleges
2. **Reset Database**: Start with clean collections
3. **Bootstrap Admin**: Create first admin user
4. **Import Real Data**: Add actual colleges and users

### Configuration Updates
1. **Remove Demo Mode**: Remove demo mode logic from components
2. **Update Authentication**: Implement strict role checking
3. **Secure APIs**: Add proper authorization to all endpoints
4. **Update UI**: Remove demo banners and mock data

## 🚀 Deployment Checklist

### Environment Setup
- [ ] MongoDB connection configured
- [ ] GitLab OAuth app created and configured
- [ ] Environment variables set
- [ ] Admin bootstrap script ready

### Security
- [ ] All API endpoints have proper authentication
- [ ] Role-based access control implemented
- [ ] Input validation on all forms
- [ ] Error handling for unauthorized access

### Testing
- [ ] Admin can create users and colleges
- [ ] Mentors can only access their college
- [ ] Interns can only access their data
- [ ] Unauthorized users are properly rejected

## 📞 Support

### Common Issues
1. **"User not found" error**: User needs to be pre-registered
2. **"Access denied" error**: Check user role and permissions
3. **"College not found" error**: Ensure college exists and is active

### Admin Tasks
- Adding new admins, mentors, or colleges
- Managing user permissions
- Troubleshooting access issues
- System monitoring and maintenance

## 🎉 Benefits of New System

### Security
- **Controlled Access**: Only authorized users can access the system
- **Role Separation**: Clear boundaries between admin, mentor, and intern capabilities
- **Audit Trail**: Track who added each user and when

### Scalability
- **Multi-College Support**: Easy to add new colleges and mentors
- **Hierarchical Management**: Admins manage mentors, mentors manage interns
- **Flexible Permissions**: Easy to modify role capabilities

### User Experience
- **Automatic Role Detection**: Users are automatically redirected to appropriate dashboard
- **College-Scoped Views**: Users only see relevant data for their college
- **Clear Error Messages**: Helpful guidance when access is denied

This new system provides a robust, secure, and scalable foundation for managing internship tracking across multiple colleges and institutions.