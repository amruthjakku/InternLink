# InternLink GitLab Integration Guide

## Overview
InternLink features comprehensive GitLab integration that allows interns to connect their GitLab accounts for tracking development progress through commit activity, repository contributions, and coding metrics. The system supports both Personal Access Token (PAT) authentication and OAuth 2.0 flow.

## 🚀 Features

### Core Integration Features
- 🔐 **OAuth 2.0 Authentication** - Complete OAuth flow with token refresh
- 📊 **Analytics & Insights** - Commit analysis, contribution patterns, language statistics
- 🚀 **Repository Management** - Access repos, files, commits, issues, merge requests
- 🔄 **Webhooks** - Create and manage GitLab webhooks with event handling
- ⚡ **Rate Limiting** - Built-in rate limiting with request queuing
- 💾 **Caching** - Intelligent caching for improved performance
- 🛡️ **Error Handling** - Comprehensive error handling with retry logic
- 📝 **TypeScript Support** - Full type definitions and runtime type checking

### Authentication Methods

#### 1. Personal Access Token (PAT)
- **Secure Token Storage**: AES-256-GCM encryption for stored tokens
- **Token Validation**: Validates against GitLab API
- **Username Verification**: Confirms user identity
- **Permission Validation**: Token scope verification

#### 2. OAuth 2.0 Flow
- **Complete OAuth Flow**: Authorization code flow implementation
- **Token Refresh**: Automatic token refresh handling
- **Secure Storage**: Encrypted token storage
- **Session Management**: Integrated with InternLink sessions

## 🔧 Setup & Configuration

### Environment Variables
```bash
# GitLab OAuth Configuration
GITLAB_CLIENT_ID=your-gitlab-client-id
GITLAB_CLIENT_SECRET=your-gitlab-client-secret
GITLAB_REDIRECT_URI=http://localhost:3000/auth/gitlab/callback
GITLAB_URL=https://code.swecha.org

# Encryption Keys
GITLAB_ENCRYPTION_KEY=your-32-character-encryption-key
GITLAB_TOKEN_SECRET=your-token-secret

# API Configuration
GITLAB_API_TIMEOUT=30000
GITLAB_RATE_LIMIT=100
```

### GitLab Application Setup
1. **Create GitLab Application**:
   - Go to GitLab → User Settings → Applications
   - Name: "InternLink Integration"
   - Redirect URI: `http://your-domain.com/auth/gitlab/callback`
   - Scopes: `read_api`, `read_user`, `read_repository`

2. **Configure Webhooks** (Optional):
   - Repository → Settings → Webhooks
   - URL: `http://your-domain.com/api/webhooks/gitlab`
   - Events: Push events, Merge request events

## 📊 Analytics & Tracking

### Commit Activity Tracking
- **Detailed Commit History**: Fetch and display commit metadata
- **Daily/Weekly/Monthly Analytics**: Comprehensive activity summaries
- **Commit Frequency Heatmap**: 90-day GitHub-style visualization
- **Recent Commits**: Latest commits with timestamps and messages

### Progress Metrics
- **Total Commits Count**: Lifetime commit statistics
- **Active Repositories**: Number of repositories with recent activity
- **Current Commit Streak**: Consecutive days with commits
- **Weekly/Monthly Summaries**: Aggregated activity reports

### Repository Analytics
- **Repository-wise Stats**: Contribution breakdown by repository
- **Code Changes Tracking**: Lines added/deleted statistics
- **Last Activity Timestamps**: Recent activity indicators
- **Repository Metadata**: Descriptions, languages, and details

### Visual Analytics
- **Commit Heatmap**: GitHub-style contribution calendar
- **Weekly Activity Charts**: Visual activity patterns
- **Programming Language Usage**: Language distribution analysis
- **Repository Contribution Breakdown**: Detailed contribution metrics

## 🛠️ Technical Implementation

### GitLab Wrapper Usage

#### Basic Setup
```javascript
import { gitlabApiRequest } from '../utils/gitlab-api';

// Initialize the wrapper
const gitlab = new GitLabWrapper({
  clientId: process.env.GITLAB_CLIENT_ID,
  clientSecret: process.env.GITLAB_CLIENT_SECRET,
  redirectUri: process.env.GITLAB_REDIRECT_URI,
  gitlabUrl: process.env.GITLAB_URL,
  scopes: ['read_api', 'read_user', 'read_repository']
});
```

#### OAuth Flow Implementation
```javascript
// Start OAuth flow
const authUrl = gitlab.startOAuthFlow();
res.redirect(authUrl.url);

// Complete OAuth flow
const result = await gitlab.completeOAuthFlow(authorizationCode);
// Store tokens securely
await storeUserTokens(userId, result.tokens);
```

#### Fetching User Data
```javascript
// Get user profile
const userProfile = await gitlab.getCurrentUser();

// Get user repositories
const repositories = await gitlab.getUserRepositories();

// Get commit activity
const commits = await gitlab.getUserCommits({
  since: '2024-01-01',
  until: '2024-12-31'
});
```

### API Endpoints

#### Authentication Endpoints
- `GET /api/auth/gitlab` - Start GitLab OAuth flow
- `GET /api/auth/gitlab/callback` - Handle OAuth callback
- `POST /api/gitlab/token` - Store Personal Access Token
- `DELETE /api/gitlab/disconnect` - Disconnect GitLab account

#### Data Endpoints
- `GET /api/gitlab/profile` - Get GitLab user profile
- `GET /api/gitlab/repositories` - Get user repositories
- `GET /api/gitlab/commits` - Get commit history
- `GET /api/gitlab/analytics` - Get analytics data

#### Webhook Endpoints
- `POST /api/webhooks/gitlab` - Handle GitLab webhooks
- `GET /api/gitlab/webhooks` - List configured webhooks
- `POST /api/gitlab/webhooks` - Create new webhook

### Database Schema

#### GitLab Integration
```javascript
// User GitLab Integration
{
  userId: ObjectId,
  gitlabId: Number,
  username: String,
  email: String,
  accessToken: String, // Encrypted
  refreshToken: String, // Encrypted
  tokenExpiry: Date,
  lastSync: Date,
  isActive: Boolean
}

// Commit Records
{
  userId: ObjectId,
  commitId: String,
  repositoryId: Number,
  repositoryName: String,
  message: String,
  timestamp: Date,
  additions: Number,
  deletions: Number,
  files: Array
}

// Repository Data
{
  userId: ObjectId,
  repositoryId: Number,
  name: String,
  description: String,
  language: String,
  lastActivity: Date,
  commitCount: Number,
  isPrivate: Boolean
}
```

## 🔐 Security Features

### Token Security
- **AES-256-GCM Encryption**: Military-grade encryption for stored tokens
- **Secure Key Derivation**: Using scrypt for key generation
- **Authentication Tags**: Integrity verification for encrypted data
- **Token Rotation**: Automatic token refresh and rotation

### Permission Management
- **Scope Validation**: Verify token has required permissions
- **API Access Control**: Validate API access before requests
- **User Identity Confirmation**: Verify user identity on each request
- **Rate Limiting**: Prevent API abuse with request limiting

### Data Privacy
- **Encrypted Storage**: All sensitive data encrypted at rest
- **Secure Transmission**: HTTPS for all API communications
- **Access Logging**: Comprehensive audit trail
- **Data Minimization**: Only collect necessary data

## 📈 Admin Features

### GitLab Management Dashboard
- **User Integration Status**: View which users have connected GitLab
- **Token Health Monitoring**: Monitor token expiry and refresh status
- **API Usage Statistics**: Track API usage and rate limiting
- **Error Monitoring**: View and resolve integration errors

### Analytics & Reporting
- **Platform-wide Statistics**: Overall GitLab integration metrics
- **User Activity Reports**: Individual user activity summaries
- **Repository Insights**: Most active repositories and languages
- **Performance Metrics**: Integration performance and reliability

### Troubleshooting Tools
- **Token Validation**: Test and validate user tokens
- **API Health Check**: Monitor GitLab API connectivity
- **Sync Status**: View last sync times and errors
- **Manual Sync**: Force sync for specific users

## 🚨 Troubleshooting

### Common Issues

#### Authentication Problems
- **Invalid Token**: Check token permissions and expiry
- **OAuth Errors**: Verify client ID/secret and redirect URI
- **Permission Denied**: Ensure required scopes are granted
- **Token Expired**: Implement automatic token refresh

#### Data Sync Issues
- **Missing Commits**: Check repository permissions and API limits
- **Outdated Data**: Verify last sync timestamp and trigger manual sync
- **Rate Limiting**: Implement proper rate limiting and retry logic
- **Network Errors**: Handle network timeouts and connection issues

#### Performance Issues
- **Slow API Responses**: Implement caching and optimize queries
- **High Memory Usage**: Optimize data processing and pagination
- **Database Performance**: Add proper indexes and optimize queries
- **Rate Limit Exceeded**: Implement request queuing and backoff

### Debugging Tools

#### API Testing
```javascript
// Test GitLab connectivity
const health = await gitlab.healthCheck();
console.log('GitLab API Status:', health);

// Validate user token
const isValid = await gitlab.validateToken(userToken);
console.log('Token Valid:', isValid);

// Test user permissions
const permissions = await gitlab.getUserPermissions();
console.log('User Permissions:', permissions);
```

#### Logging Configuration
```javascript
// Enable debug logging
const gitlab = new GitLabWrapper({
  // ... config
  debug: true,
  logLevel: 'debug'
});

// Custom error handler
gitlab.onError((error) => {
  console.error('GitLab Error:', error);
  // Send to monitoring service
});
```

## 🔄 Webhooks & Real-time Updates

### Webhook Configuration
- **Push Events**: Track new commits in real-time
- **Merge Request Events**: Monitor code review activity
- **Issue Events**: Track issue creation and updates
- **Pipeline Events**: Monitor CI/CD pipeline status

### Event Processing
```javascript
// Handle webhook events
app.post('/api/webhooks/gitlab', async (req, res) => {
  const event = req.body;
  
  switch (event.object_kind) {
    case 'push':
      await processPushEvent(event);
      break;
    case 'merge_request':
      await processMergeRequestEvent(event);
      break;
    case 'issue':
      await processIssueEvent(event);
      break;
  }
  
  res.status(200).send('OK');
});
```

## 📚 Best Practices

### Performance Optimization
- **Implement Caching**: Cache frequently accessed data
- **Use Pagination**: Handle large datasets with pagination
- **Batch Requests**: Group multiple API calls when possible
- **Monitor Rate Limits**: Track and respect API rate limits

### Security Best Practices
- **Encrypt Sensitive Data**: Always encrypt tokens and personal data
- **Validate Input**: Sanitize and validate all user input
- **Use HTTPS**: Ensure all communications are encrypted
- **Regular Token Rotation**: Implement automatic token refresh

### Error Handling
- **Graceful Degradation**: Handle API failures gracefully
- **Retry Logic**: Implement exponential backoff for retries
- **User Feedback**: Provide clear error messages to users
- **Monitoring**: Set up alerts for critical errors

### Data Management
- **Regular Cleanup**: Remove old or unnecessary data
- **Data Validation**: Validate data integrity regularly
- **Backup Strategy**: Implement regular data backups
- **Privacy Compliance**: Ensure GDPR/privacy compliance