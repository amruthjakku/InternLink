# GitLab Integration Guide

## Overview
The InternLink platform includes a comprehensive GitLab integration that allows interns to connect their GitLab accounts using Personal Access Tokens (PAT) to track their development progress through commit activity, repository contributions, and coding metrics.

## Features Implemented

### ✅ **Core Features**
1. **Personal Access Token Authentication**
   - Secure token storage with encryption
   - Token validation against GitLab API
   - Username verification

2. **Commit Activity Tracking**
   - Fetch and display detailed commit history
   - Daily/weekly/monthly commit analytics
   - Commit frequency heatmap (90-day view)
   - Recent commits with metadata

3. **Progress Metrics**
   - Total commits count
   - Active repositories count
   - Current commit streak
   - Weekly/monthly activity summaries

4. **Repository Analytics**
   - Repository-wise contribution stats
   - Code additions/deletions tracking
   - Last activity timestamps
   - Repository descriptions and metadata

5. **Visual Analytics**
   - Commit heatmap (GitHub-style)
   - Weekly activity charts
   - Programming language usage
   - Repository contribution breakdown

### ✅ **Security Features**
1. **Token Encryption**
   - AES-256-GCM encryption for stored tokens
   - Secure key derivation using scrypt
   - Authentication tags for integrity

2. **Permission Validation**
   - Token scope verification
   - API access validation
   - User identity confirmation

3. **Data Privacy**
   - Encrypted storage of sensitive data
   - Secure API communication
   - User-controlled repository selection

## How to Use

### Step 1: Create GitLab Personal Access Token
1. Go to GitLab → Settings → Access Tokens
2. Create a new token with these scopes:
   - `read_api` - Read access to API
   - `read_repository` - Read repository data
   - `read_user` - Read user profile
3. Copy the generated token (starts with `glpat-`)

### Step 2: Connect Account in InternLink
1. Navigate to GitLab tab in intern dashboard
2. Click "Connect GitLab Account"
3. Enter your GitLab username
4. Paste your Personal Access Token
5. Optionally specify repositories to track
6. Click "Connect Account"

### Step 3: View Analytics
Once connected, you can:
- View commit activity overview
- Explore detailed commit history
- Analyze coding patterns and streaks
- Track repository contributions
- Monitor programming language usage

## API Endpoints

### Authentication
- `POST /api/gitlab/connect-token` - Connect using PAT
- `GET /api/gitlab/connection-status` - Check connection status

### Data Fetching
- `GET /api/gitlab/intern-analytics` - Get comprehensive analytics
- `POST /api/gitlab/sync-commits` - Manual sync commits
- `GET /api/gitlab/commits` - Get commit history

## Database Models

### GitLabIntegration
Stores user connection data:
```javascript
{
  userId: ObjectId,
  gitlabUserId: Number,
  gitlabUsername: String,
  accessToken: String (encrypted),
  tokenType: 'personal_access_token',
  specificRepositories: [String],
  repositories: [RepositorySchema],
  permissions: PermissionSchema,
  lastSyncAt: Date,
  isActive: Boolean
}
```

### ActivityTracking
Stores detailed activity data:
```javascript
{
  userId: ObjectId,
  type: 'commit',
  gitlabId: String,
  projectId: Number,
  projectName: String,
  title: String,
  message: String,
  metadata: {
    authorName: String,
    authorEmail: String,
    additions: Number,
    deletions: Number,
    webUrl: String
  },
  activityCreatedAt: Date
}
```

## Analytics Generated

### Summary Metrics
- **Total Commits**: All-time commit count
- **Active Repositories**: Number of repos with recent activity
- **Current Streak**: Consecutive days with commits
- **Weekly/Monthly Commits**: Recent activity counts

### Detailed Analytics
- **Commit Heatmap**: 90-day activity visualization
- **Weekly Activity**: Commit trends over time
- **Repository Stats**: Per-repo contribution breakdown
- **Language Usage**: Programming language distribution

### Progress Tracking
- **Commit Frequency**: Daily/weekly patterns
- **Code Contributions**: Lines added/removed
- **Repository Diversity**: Number of active projects
- **Consistency Metrics**: Streak tracking and regularity

## Troubleshooting

### Common Issues

1. **"Invalid Personal Access Token"**
   - Verify token has correct scopes
   - Check token hasn't expired
   - Ensure username matches token owner

2. **"No commits found"**
   - Check if repositories have recent activity
   - Verify username in commits matches GitLab username
   - Ensure repositories are accessible with token

3. **"Connection failed"**
   - Check internet connectivity
   - Verify GitLab API is accessible
   - Try regenerating the token

### Token Permissions Required
```
read_api        - Read API access
read_repository - Repository data access
read_user       - User profile access
```

### Supported GitLab Instances
- GitLab.com (default)
- Self-hosted GitLab instances (with configuration)

## Future Enhancements

### Planned Features
1. **Merge Request Tracking**
   - MR creation and review metrics
   - Code review participation
   - Approval/rejection tracking

2. **Issue Management**
   - Issue creation and resolution
   - Bug fix tracking
   - Feature development metrics

3. **CI/CD Integration**
   - Pipeline success rates
   - Build failure analysis
   - Deployment frequency

4. **Team Collaboration**
   - Code review metrics
   - Collaboration patterns
   - Mentorship tracking

5. **Advanced Analytics**
   - Code quality metrics
   - Technical debt tracking
   - Performance impact analysis

## Security Considerations

### Data Protection
- All tokens encrypted at rest
- Secure API communication (HTTPS)
- Regular token validation
- User-controlled data access

### Privacy
- Users control which repositories to track
- No access to private data without permission
- Transparent data usage
- Easy disconnection option

### Compliance
- GDPR-compliant data handling
- User consent for data collection
- Right to data deletion
- Audit trail maintenance

## Technical Implementation

### Frontend Components
- `GitLabTab.js` - Main integration interface
- `GitLabCommitTracker.js` - Commit visualization
- Form handling with validation
- Real-time sync capabilities

### Backend Services
- Token encryption/decryption utilities
- GitLab API integration
- Database models and schemas
- Analytics generation algorithms

### API Integration
- RESTful GitLab API v4
- Pagination handling
- Rate limiting compliance
- Error handling and retries

## Monitoring and Maintenance

### Health Checks
- Token validity monitoring
- API connectivity checks
- Sync success tracking
- Error rate monitoring

### Performance
- Efficient data fetching
- Caching strategies
- Background sync jobs
- Database optimization

### Updates
- GitLab API version compatibility
- Feature enhancement deployment
- Security patch management
- User notification system

This comprehensive GitLab integration provides interns and mentors with powerful tools to track development progress objectively through actual coding activity, making it easier to measure growth and identify areas for improvement.