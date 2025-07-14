# GitLab OAuth Transition Guide

## Overview

This guide documents the transition from GitLab Personal Access Tokens (PATs) to OAuth-based authentication for GitLab integration in the InternLink application.

## Table of Contents

1. [Why Transition to OAuth?](#why-transition-to-oauth)
2. [Architecture Changes](#architecture-changes)
3. [Implementation Details](#implementation-details)
4. [Migration Process](#migration-process)
5. [API Changes](#api-changes)
6. [User Experience](#user-experience)
7. [Security Improvements](#security-improvements)
8. [Troubleshooting](#troubleshooting)

## Why Transition to OAuth?

### Problems with Personal Access Tokens (PATs)

1. **Manual Token Management**: Users must manually create and manage tokens
2. **Security Risks**: Tokens don't expire automatically and can be easily compromised
3. **User Experience**: Complex setup process requiring GitLab knowledge
4. **Maintenance Overhead**: Tokens need manual renewal and scope management
5. **Limited Scope Control**: Often granted broader permissions than necessary

### Benefits of OAuth

1. **Automatic Token Management**: Tokens refresh automatically
2. **Better Security**: Scoped permissions and automatic expiration
3. **Improved UX**: One-click authentication through GitLab
4. **Centralized Control**: Tokens can be revoked from GitLab settings
5. **Audit Trail**: Better tracking of application access

## Architecture Changes

### Before (PAT-based)
```
User → Manual PAT Creation → Application → GitLab API
```

### After (OAuth-based)
```
User → OAuth Flow → Application → Token Refresh → GitLab API
```

### Hybrid Approach (Transition Period)
```
User → OAuth (Preferred) → Application → GitLab API
     → PAT (Fallback)    →            →
```

## Implementation Details

### New Components

#### 1. OAuth API Utility (`utils/gitlab-oauth-api.js`)
- `GitLabOAuthAPI` class for OAuth-based API operations
- Automatic token refresh functionality
- Error handling and retry logic

#### 2. Enhanced Authentication (`app/api/auth/[...nextauth]/route.js`)
- Stores OAuth tokens in GitLabIntegration model
- Automatic integration creation on login

#### 3. New API Endpoints
- `/api/gitlab/oauth-status` - Check OAuth integration status
- `/api/gitlab/oauth-activity` - Fetch activity using OAuth
- `/api/gitlab/oauth-test` - Test OAuth connection

#### 4. Enhanced Components
- `EnhancedGitLabTab` - Prioritizes OAuth over PAT
- Migration prompts and status indicators

### Database Schema Updates

The `GitLabIntegration` model already supports both token types:

```javascript
{
  tokenType: {
    type: String,
    enum: ['oauth', 'personal_access_token'],
    default: 'oauth'
  },
  // OAuth-specific fields
  refreshToken: String,
  tokenExpiresAt: Date,
  // Migration tracking
  migrationStatus: String,
  migrationRequestedAt: Date
}
```

## Migration Process

### Phase 1: Preparation
1. Deploy OAuth-enhanced code
2. Run migration script to identify PAT users
3. Update user interfaces to show OAuth options

### Phase 2: User Migration
1. Users see OAuth upgrade prompts on login
2. OAuth integration created alongside existing PAT
3. System automatically prioritizes OAuth

### Phase 3: Cleanup (Optional)
1. Monitor OAuth adoption rates
2. Disable PAT integrations for migrated users
3. Remove PAT-specific code (future release)

### Migration Script Usage

```bash
# Check current status
node scripts/migrate-to-oauth.js

# Dry run for all users
node scripts/migrate-to-oauth.js --dry-run --all

# Migrate all PAT users
node scripts/migrate-to-oauth.js --all

# Migrate specific user
node scripts/migrate-to-oauth.js --user-id=507f1f77bcf86cd799439011
```

## API Changes

### New OAuth-Specific Endpoints

#### GET `/api/gitlab/oauth-status`
Check if user has valid OAuth integration.

**Response:**
```json
{
  "hasOAuthToken": true,
  "hasStoredIntegration": true,
  "tokenExpired": false,
  "canUseOAuth": true,
  "integration": {
    "gitlabUsername": "john_doe",
    "connectedAt": "2024-01-15T10:30:00Z",
    "repositoryCount": 5
  }
}
```

#### GET `/api/gitlab/oauth-activity`
Fetch GitLab activity using OAuth tokens.

**Query Parameters:**
- `since` - ISO date string for activity start
- `until` - ISO date string for activity end
- `includeStats` - Include detailed statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "commits": [...],
    "projects": [...],
    "totalCommits": 42,
    "activeProjects": 3
  },
  "stats": {
    "totalAdditions": 1250,
    "totalDeletions": 340,
    "averageCommitsPerDay": 2.1
  },
  "meta": {
    "tokenType": "oauth"
  }
}
```

#### POST `/api/gitlab/oauth-connect`
Connect GitLab account using OAuth token from session.

**Response:**
```json
{
  "success": true,
  "message": "GitLab OAuth integration connected successfully",
  "integration": {
    "gitlabUsername": "john_doe",
    "repositoryCount": 5,
    "connectedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Enhanced Existing Endpoints

Existing endpoints now automatically detect and prioritize OAuth over PAT:

- `/api/gitlab/connection-status` - Shows preferred connection method
- `/api/gitlab/simple-sync` - Uses OAuth when available
- `/api/gitlab/activity` - Falls back to PAT if OAuth unavailable

## User Experience

### For New Users
1. Sign in with GitLab OAuth
2. Automatic GitLab integration setup
3. Immediate access to commit tracking

### For Existing PAT Users
1. See OAuth upgrade prompt on login
2. One-click OAuth connection
3. Seamless transition with data preservation

### UI Indicators
- 🔐 OAuth integration (preferred)
- 🔑 PAT integration (legacy)
- ✅ Connected status
- ⚠️ Upgrade available

## Security Improvements

### Token Security
- **OAuth Tokens**: Encrypted storage, automatic refresh, scoped permissions
- **PAT Tokens**: Manual management, broader permissions, no expiration

### Access Control
- **OAuth**: Granular scopes (`read_user`, `read_api`, `read_repository`)
- **PAT**: Often granted full `api` scope

### Audit Trail
- **OAuth**: GitLab tracks application access
- **PAT**: Limited visibility into usage

### Revocation
- **OAuth**: Can be revoked from GitLab → Settings → Applications
- **PAT**: Must be manually deleted from GitLab → Settings → Access Tokens

## Troubleshooting

### Common Issues

#### 1. OAuth Token Expired
**Symptoms**: API calls fail with 401 errors
**Solution**: Token should auto-refresh; check refresh token validity

#### 2. Missing Scopes
**Symptoms**: 403 errors for specific operations
**Solution**: Verify OAuth application has required scopes configured

#### 3. Integration Not Found
**Symptoms**: "No OAuth integration found" errors
**Solution**: User needs to reconnect via OAuth

#### 4. Migration Stuck
**Symptoms**: User still sees PAT interface after OAuth connection
**Solution**: Clear browser cache and check database integration record

### Debug Endpoints

#### GET `/api/gitlab/oauth-test`
Test OAuth connection and show detailed status.

#### GET `/api/debug/gitlab-integration`
Show detailed integration status for current user (admin only).

### Logging

OAuth operations are logged with prefixes:
- `✅ OAuth tokens stored for GitLab integration`
- `🔄 Token expires at X, refreshing...`
- `❌ Error refreshing OAuth token`

### Environment Variables

Ensure these are properly configured:
```env
GITLAB_CLIENT_ID=your_oauth_app_id
GITLAB_CLIENT_SECRET=your_oauth_app_secret
GITLAB_ISSUER=https://code.swecha.org
GITLAB_API_BASE=https://code.swecha.org/api/v4
```

## Rollback Plan

If issues arise, the system can fall back to PAT-only mode:

1. Disable OAuth endpoints in load balancer
2. Update UI to hide OAuth options
3. System automatically uses PAT integrations
4. No data loss as both integrations coexist

## Future Enhancements

### Phase 2 Features
1. **Webhook Integration**: Real-time updates via GitLab webhooks
2. **Advanced Scopes**: Request additional permissions as needed
3. **Multi-Instance Support**: Support multiple GitLab instances
4. **Token Analytics**: Track token usage and performance

### Phase 3 Features
1. **SSO Integration**: Single sign-on with GitLab
2. **Advanced Permissions**: Fine-grained repository access
3. **Automated Onboarding**: Automatic user registration via OAuth

## Conclusion

The OAuth transition improves security, user experience, and maintainability while preserving backward compatibility. The hybrid approach ensures a smooth migration path for existing users while providing immediate benefits for new users.

For questions or issues, refer to the troubleshooting section or contact the development team.