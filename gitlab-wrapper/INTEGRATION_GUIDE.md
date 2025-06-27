# GitLab Wrapper Integration Guide

This guide explains how to integrate the GitLab wrapper into your InternLink project.

## Quick Start

### 1. Import the Wrapper

```javascript
// Import the main wrapper
import { GitLabWrapper } from './gitlab-wrapper/index.js';

// Or import specific components
import { GitLabAPI } from './gitlab-wrapper/api/GitLabAPI.js';
import { GitLabOAuth } from './gitlab-wrapper/auth/GitLabOAuth.js';
import { GitLabAnalytics } from './gitlab-wrapper/analytics/GitLabAnalytics.js';
```

### 2. Basic Setup

```javascript
const gitlab = new GitLabWrapper({
  clientId: process.env.GITLAB_CLIENT_ID,
  clientSecret: process.env.GITLAB_CLIENT_SECRET,
  redirectUri: process.env.GITLAB_REDIRECT_URI,
  gitlabUrl: 'https://code.swecha.org',
  scopes: ['read_api', 'read_user', 'read_repository']
});
```

### 3. Environment Variables

Add these to your `.env.local`:

```bash
GITLAB_CLIENT_ID=your_client_id
GITLAB_CLIENT_SECRET=your_client_secret
GITLAB_REDIRECT_URI=http://localhost:3000/auth/gitlab/callback
GITLAB_URL=https://code.swecha.org
GITLAB_WEBHOOK_SECRET=your_webhook_secret
```

## Integration with InternLink

### Replace Existing GitLab Integration

1. **Update OAuth Flow** (in `app/api/auth/gitlab/` routes):
```javascript
import { GitLabWrapper } from '../../../../gitlab-wrapper/index.js';

const gitlab = new GitLabWrapper({
  clientId: process.env.GITLAB_CLIENT_ID,
  clientSecret: process.env.GITLAB_CLIENT_SECRET,
  redirectUri: process.env.GITLAB_REDIRECT_URI,
  gitlabUrl: process.env.GITLAB_URL || 'https://code.swecha.org'
});

// Start OAuth flow
export async function GET(request) {
  const authData = gitlab.startOAuthFlow();
  return Response.redirect(authData.url);
}

// Handle callback
export async function POST(request) {
  const { code, state } = await request.json();
  const result = await gitlab.completeOAuthFlow(code, state);
  return Response.json(result);
}
```

2. **Update GitLab API Calls** (replace existing `utils/gitlab-api.js`):
```javascript
import { GitLabAPI } from '../gitlab-wrapper/api/GitLabAPI.js';

export async function getGitLabData(accessToken, userId) {
  const api = new GitLabAPI(accessToken, {
    gitlabUrl: process.env.GITLAB_URL || 'https://code.swecha.org'
  });

  const [user, projects, commits] = await Promise.all([
    api.getCurrentUser(),
    api.getUserProjects({ perPage: 50 }),
    api.getUserEvents({ perPage: 20 })
  ]);

  return { user, projects, commits };
}
```

3. **Add Analytics** (new feature):
```javascript
import { GitLabAnalytics } from '../gitlab-wrapper/analytics/GitLabAnalytics.js';

export async function getCommitAnalytics(accessToken, options = {}) {
  const api = new GitLabAPI(accessToken);
  const analytics = new GitLabAnalytics(api);

  return await analytics.getUserCommitActivity({
    days: options.days || 30,
    includeStats: true,
    includeHeatmap: true,
    includeLanguages: true
  });
}
```

### Update Components

1. **GitLab Tab Component**:
```javascript
// components/intern/GitLabTab.js
import { useState, useEffect } from 'react';

export default function GitLabTab({ user }) {
  const [gitlabData, setGitlabData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch basic GitLab data
        const response = await fetch('/api/gitlab/user-data');
        const data = await response.json();
        setGitlabData(data);

        // Fetch analytics
        const analyticsResponse = await fetch('/api/gitlab/analytics');
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Error fetching GitLab data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading GitLab data...</div>;

  return (
    <div className="space-y-6">
      {/* Basic GitLab Info */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">GitLab Profile</h3>
        {gitlabData?.user && (
          <div>
            <p><strong>Username:</strong> {gitlabData.user.username}</p>
            <p><strong>Name:</strong> {gitlabData.user.name}</p>
            <p><strong>Projects:</strong> {gitlabData.projects?.length || 0}</p>
          </div>
        )}
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Commit Analytics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.totalCommits}
              </div>
              <div className="text-sm text-gray-600">Total Commits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.activeProjects}
              </div>
              <div className="text-sm text-gray-600">Active Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.statistics?.streak?.current || 0}
              </div>
              <div className="text-sm text-gray-600">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {analytics.statistics?.streak?.longest || 0}
              </div>
              <div className="text-sm text-gray-600">Longest Streak</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

2. **API Routes**:
```javascript
// app/api/gitlab/user-data/route.js
import { getServerSession } from 'next-auth';
import { GitLabAPI } from '../../../../gitlab-wrapper/api/GitLabAPI.js';

export async function GET() {
  const session = await getServerSession();
  
  if (!session?.accessToken) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const api = new GitLabAPI(session.accessToken);
    
    const [user, projects, events] = await Promise.all([
      api.getCurrentUser(),
      api.getUserProjects({ perPage: 20 }),
      api.getUserEvents({ perPage: 10 })
    ]);

    return Response.json({ user, projects, events });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

```javascript
// app/api/gitlab/analytics/route.js
import { getServerSession } from 'next-auth';
import { GitLabAPI } from '../../../../gitlab-wrapper/api/GitLabAPI.js';
import { GitLabAnalytics } from '../../../../gitlab-wrapper/analytics/GitLabAnalytics.js';

export async function GET(request) {
  const session = await getServerSession();
  
  if (!session?.accessToken) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 30;

    const api = new GitLabAPI(session.accessToken);
    const analytics = new GitLabAnalytics(api);
    
    const activity = await analytics.getUserCommitActivity({
      days,
      includeStats: true,
      includeHeatmap: true,
      includeLanguages: true
    });

    return Response.json(activity);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

## Advanced Features

### 1. Webhooks

```javascript
// app/api/webhooks/gitlab/route.js
import { GitLabWebhooks } from '../../../../gitlab-wrapper/webhooks/GitLabWebhooks.js';

const webhooks = new GitLabWebhooks({
  secretToken: process.env.GITLAB_WEBHOOK_SECRET,
  enableSignatureVerification: true
});

// Register event handlers
webhooks.on('push', async (eventInfo, payload) => {
  console.log('Push event received:', eventInfo.project.name);
  // Update intern activity, trigger notifications, etc.
});

webhooks.on('merge_request', async (eventInfo, payload) => {
  console.log('Merge request event:', eventInfo.object.action);
  // Update task completion, notify mentors, etc.
});

export async function POST(request) {
  try {
    const payload = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    
    const result = await webhooks.handleWebhook(payload, headers);
    return Response.json({ success: true, processed: result.processed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

### 2. Caching

```javascript
// Enable caching for better performance
const gitlab = new GitLabWrapper({
  // ... other config
  enableCache: true,
  cache: {
    type: 'memory',
    ttl: 300, // 5 minutes
    maxSize: 1000
  }
});
```

### 3. Rate Limiting

```javascript
// Enable rate limiting
const gitlab = new GitLabWrapper({
  // ... other config
  enableRateLimit: true,
  rateLimit: {
    requestsPerMinute: 600,
    enableQueuing: true,
    maxQueueSize: 100
  }
});
```

## Migration Checklist

- [ ] Update environment variables
- [ ] Replace OAuth flow implementation
- [ ] Update GitLab API calls
- [ ] Add analytics endpoints
- [ ] Update components to use new data structure
- [ ] Test authentication flow
- [ ] Test data fetching
- [ ] Set up webhooks (optional)
- [ ] Enable caching and rate limiting
- [ ] Update error handling

## Benefits

1. **Better Error Handling**: Specific error types and retry logic
2. **Enhanced Analytics**: Detailed commit analysis and insights
3. **Improved Performance**: Built-in caching and rate limiting
4. **Webhook Support**: Real-time event processing
5. **Type Safety**: Runtime type checking and validation
6. **Modular Design**: Use only the components you need

## Support

For issues or questions:
1. Check the main README.md for detailed documentation
2. Look at the examples in the `examples/` folder
3. Review the implementation summary in `GITLAB_WRAPPER_SUMMARY.md`