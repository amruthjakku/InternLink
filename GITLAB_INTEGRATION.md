# GitLab Integration for Internship Tracker

This document describes the comprehensive GitLab integration system that tracks intern progress through commits, issues, merge requests, and other development activities.

## 🚀 Features

### For Interns
- **Development Activity Dashboard**: View commits, issues, and merge requests
- **Progress Metrics**: Track lines of code, project contributions, and activity trends
- **Repository Management**: Connect and track multiple GitLab projects
- **Real-time Sync**: Automatic synchronization of GitLab data
- **Activity Timeline**: Chronological view of development activities

### For Mentors
- **Team Overview**: Monitor all interns' development activity
- **Individual Progress**: Detailed view of each intern's contributions
- **Analytics Dashboard**: Team-wide metrics and trends
- **Performance Tracking**: Progress percentages and activity levels
- **Project Insights**: Cross-project activity analysis

## 🏗️ Architecture

### Core Components

1. **GitLab API Wrapper** (`utils/gitlab-api.js`)
   - Handles all GitLab API interactions
   - Rate limiting and error handling
   - Supports commits, issues, merge requests, and analytics

2. **Database Models**
   - `GitLabIntegration`: Stores OAuth tokens and repository preferences
   - `ActivityTracking`: Detailed activity data for analytics

3. **Sync Service** (`utils/gitlab-sync.js`)
   - Background synchronization of GitLab data
   - Token refresh handling
   - Activity aggregation and analytics

4. **API Endpoints**
   - `/api/gitlab/connect`: OAuth connection management
   - `/api/gitlab/commits`: Commit data retrieval
   - `/api/gitlab/analytics`: User analytics and insights
   - `/api/mentors/team-activity`: Team overview for mentors

5. **Dashboard Components**
   - `GitLabIntegration`: Intern development activity view
   - `TeamActivity`: Mentor team overview dashboard

## 🔧 Setup Instructions

### 1. GitLab OAuth Application

1. Go to [GitLab Applications](https://gitlab.com/-/profile/applications)
2. Click "New Application"
3. Configure:
   - **Name**: Internship Tracker
   - **Redirect URI**: `http://localhost:3000/api/auth/callback/gitlab`
   - **Scopes**: `read_user`, `read_api`, `read_repository`

### 2. Environment Variables

Add to your `.env.local`:

```env
# GitLab OAuth Configuration
GITLAB_CLIENT_ID=your_client_id_here
GITLAB_CLIENT_SECRET=your_client_secret_here
GITLAB_ISSUER=https://gitlab.com

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# Encryption Configuration
ENCRYPTION_SECRET=your-32-character-secret-key-here!!

# Optional: Sync API Token for scheduled tasks
SYNC_API_TOKEN=your-sync-token-here
```

### 3. Database Setup

The system automatically creates the required MongoDB collections:
- `gitlabintegrations`: OAuth tokens and repository tracking
- `activitytrackings`: Detailed activity data

### 4. Dependencies

Install required packages:

```bash
npm install mongoose
```

## 📊 Data Flow

### 1. OAuth Connection
```
User → GitLab OAuth → Access Token → Encrypted Storage → Database
```

### 2. Data Synchronization
```
Scheduled Sync → GitLab API → Activity Processing → Database Storage → Dashboard Display
```

### 3. Analytics Generation
```
Raw Activity Data → Aggregation → Metrics Calculation → Dashboard Visualization
```

## 🔐 Security Features

### Token Management
- **Encryption**: All OAuth tokens are encrypted using AES-256-GCM
- **Secure Storage**: Tokens stored with IV and authentication tags
- **Auto Refresh**: Automatic token refresh when expired
- **Scope Limitation**: Minimal required scopes for GitLab access

### Data Protection
- **User Isolation**: Each user's data is strictly isolated
- **Permission Checks**: Role-based access control for mentors
- **Secure APIs**: All endpoints require authentication
- **Error Handling**: Graceful handling of API failures

## 📈 Analytics & Metrics

### Individual Metrics
- **Commit Activity**: Count, frequency, and trends
- **Code Changes**: Lines added/deleted, files modified
- **Issue Management**: Issues created, assigned, resolved
- **Merge Requests**: Created, reviewed, merged
- **Project Involvement**: Active repositories and contributions
- **Language Usage**: Programming languages used

### Team Metrics
- **Team Overview**: Total commits, active interns, open issues
- **Progress Tracking**: Individual progress percentages
- **Activity Trends**: Daily/weekly activity patterns
- **Project Distribution**: Cross-project team involvement
- **Performance Comparison**: Relative intern performance

## 🔄 Synchronization

### Automatic Sync
- **Frequency**: Configurable (default: daily)
- **Scope**: All active integrations
- **Rate Limiting**: Respects GitLab API limits
- **Error Recovery**: Graceful handling of failures

### Manual Sync
- **User Triggered**: Sync button in dashboard
- **Real-time Updates**: Immediate data refresh
- **Progress Indication**: Loading states and feedback

### Scheduled Sync
```bash
# Example cron job for daily sync at 2 AM
0 2 * * * curl -X POST -H "Authorization: Bearer YOUR_SYNC_TOKEN" http://localhost:3000/api/gitlab/sync
```

## 🎨 UI Components

### Intern Dashboard
- **Activity Cards**: Commit count, issues, lines of code
- **Recent Commits**: Latest 5 commits with project context
- **Project Activity**: Per-project contribution breakdown
- **Progress Visualization**: Charts and metrics

### Mentor Dashboard
- **Team Metrics**: Overview cards with key statistics
- **Intern Progress**: Individual cards with activity details
- **Activity Timeline**: Team-wide activity trends
- **Performance Indicators**: Progress bars and status indicators

## 🚨 Error Handling

### API Errors
- **Rate Limiting**: Automatic retry with backoff
- **Token Expiry**: Automatic refresh or re-authentication prompt
- **Network Issues**: Graceful degradation to cached data
- **Permission Errors**: Clear user feedback and resolution steps

### Data Integrity
- **Duplicate Prevention**: Unique constraints on activity records
- **Validation**: Input validation and sanitization
- **Backup Strategy**: Regular data backups recommended
- **Recovery Procedures**: Data recovery from GitLab API if needed

## 🔧 Customization

### Adding New Metrics
1. Extend `ActivityTracking` schema with new fields
2. Update sync service to collect additional data
3. Modify analytics aggregation logic
4. Update dashboard components

### Custom Sync Intervals
```javascript
// In your sync service
const SYNC_INTERVALS = {
  commits: '1h',      // Hourly
  issues: '4h',       // Every 4 hours
  analytics: '24h'    // Daily
};
```

### Dashboard Themes
```css
/* Custom color schemes */
.metric-card-commits { @apply bg-blue-50 text-blue-600; }
.metric-card-issues { @apply bg-green-50 text-green-600; }
.metric-card-lines { @apply bg-purple-50 text-purple-600; }
```

## 🐛 Troubleshooting

### Common Issues

1. **"GitLab not connected" error**
   - Check OAuth application configuration
   - Verify redirect URI matches exactly
   - Ensure client ID/secret are correct

2. **Token expired errors**
   - Check token expiry in database
   - Verify refresh token is valid
   - Re-authenticate if necessary

3. **Sync failures**
   - Check GitLab API rate limits
   - Verify network connectivity
   - Review error logs for specific issues

4. **Missing data**
   - Ensure user has access to repositories
   - Check GitLab permissions and scopes
   - Verify sync service is running

### Debug Mode
```javascript
// Enable debug logging
process.env.DEBUG_GITLAB = 'true';
```

## 📚 API Reference

### GitLab API Wrapper Methods

```javascript
const gitlab = new GitLabAPI(accessToken);

// User data
await gitlab.getUserProfile();
await gitlab.getUserProjects();

// Activity data
await gitlab.getUserCommits(userEmail, since, until);
await gitlab.getUserIssues(userId);
await gitlab.getUserMergeRequests(userId);

// Analytics
await gitlab.getUserAnalytics(userEmail, since);
```

### Database Models

```javascript
// GitLab Integration
{
  userId: ObjectId,
  gitlabUserId: Number,
  accessToken: String (encrypted),
  refreshToken: String (encrypted),
  repositories: [{ projectId, name, url, isTracked }],
  permissions: { canAccessRepositories, canTrackCommits },
  lastSyncAt: Date
}

// Activity Tracking
{
  userId: ObjectId,
  type: 'commit|issue|merge_request',
  gitlabId: String,
  projectId: Number,
  title: String,
  metadata: { additions, deletions, state, labels },
  activityCreatedAt: Date
}
```

## 🚀 Future Enhancements

### Planned Features
- **Code Quality Metrics**: Integration with code analysis tools
- **Deployment Tracking**: CI/CD pipeline monitoring
- **Collaboration Metrics**: Code review participation
- **Learning Path Integration**: Skill development tracking
- **Automated Reporting**: Weekly/monthly progress reports
- **Mobile Dashboard**: React Native companion app

### Integration Opportunities
- **GitHub Support**: Multi-platform repository tracking
- **Jira Integration**: Issue tracking across platforms
- **Slack Notifications**: Real-time activity updates
- **Email Reports**: Automated progress summaries

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review GitLab API documentation
3. Check application logs for error details
4. Verify environment configuration

## 📄 License

This GitLab integration is part of the Internship Tracker project and follows the same licensing terms.