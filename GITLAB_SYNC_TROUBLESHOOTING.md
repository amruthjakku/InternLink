# GitLab Sync Troubleshooting Guide

## Issue: Repositories and Commits Not Showing After Sync

### Problem Description
After connecting to GitLab account and pressing the sync button, the sync shows success but no repositories or commits are displayed in the GitLab tab.

### Root Cause Analysis
The main issue was in the `sync-commits` API route (`/app/api/gitlab/sync-commits/route.js`) which was hardcoded to use `https://gitlab.com/api/v4` instead of the configured Swecha GitLab instance `https://code.swecha.org/api/v4`.

### Fixes Applied

#### 1. Fixed API Base URL in Sync Route
**File:** `/app/api/gitlab/sync-commits/route.js`

**Problem:** Hardcoded GitLab.com URL
```javascript
// OLD - WRONG
const projectsResponse = await fetch(
  'https://gitlab.com/api/v4/projects?membership=true&per_page=100',
  // ...
);
```

**Solution:** Use configurable API base
```javascript
// NEW - CORRECT
const apiBase = integration.apiBase || process.env.GITLAB_API_BASE || 'https://code.swecha.org/api/v4';
const projectsResponse = await fetch(
  `${apiBase}/projects?membership=true&per_page=100`,
  // ...
);
```

#### 2. Enhanced Debugging and Logging
Added comprehensive logging to track:
- API base URL being used
- Number of projects found
- Commits processed per project
- Sync results summary

#### 3. Created Debug Tools
- **Debug Page:** `/debug-gitlab` - Comprehensive debugging interface
- **Debug Component:** `GitLabDebugger` - Real-time sync monitoring
- **Test Connection:** Enhanced connection testing

### Debugging Steps

#### Step 1: Check Environment Variables
Ensure these are set in `.env.local`:
```env
GITLAB_API_BASE=https://code.swecha.org/api/v4
GITLAB_ISSUER=https://code.swecha.org
```

#### Step 2: Use Debug Page
1. Navigate to `/debug-gitlab` in your browser
2. Click "Refresh Debug Info" to check connection status
3. Click "Test Sync" to perform a sync with detailed logging
4. Check the "Analytics Data" tab to see if data is being fetched

#### Step 3: Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Perform a sync operation
4. Look for any error messages or API failures

#### Step 4: Check Server Logs
Monitor the server console for detailed sync logs:
```bash
npm run dev
```

Look for logs like:
```
Syncing GitLab data for [username] since [date]
Using GitLab API base: https://code.swecha.org/api/v4
Found X projects for user [username]
Processing project: [project-name] (ID: [id])
Found X commits for project [project-name] on page 1
Sync completed for [username]: { commitsProcessed: X, newCommits: X, projectsScanned: X }
```

### Common Issues and Solutions

#### Issue 1: "No projects found"
**Symptoms:** Sync completes but shows 0 projects
**Causes:**
- Wrong API base URL
- Invalid access token
- User has no projects with membership

**Solutions:**
1. Verify API base URL in environment variables
2. Check token permissions (needs `read_api`, `read_repository`, `read_user`)
3. Ensure user has projects in Swecha GitLab

#### Issue 2: "Projects found but no commits"
**Symptoms:** Projects are detected but no commits are synced
**Causes:**
- Username mismatch in commit author filtering
- Date range too restrictive
- No commits by the user in the specified timeframe

**Solutions:**
1. Check if GitLab username matches exactly (case-sensitive)
2. Extend sync date range (currently 30 days)
3. Verify user has commits in their repositories

#### Issue 3: "Sync success but data not displayed"
**Symptoms:** Sync API returns success but UI shows no data
**Causes:**
- Frontend not refreshing data after sync
- Data structure mismatch between API and UI
- Caching issues

**Solutions:**
1. Hard refresh the page (Ctrl+F5)
2. Check if `fetchGitLabData()` is called after sync
3. Verify data structure in debug page

### API Endpoints for Manual Testing

#### Test Connection
```bash
curl -X POST http://localhost:3000/api/gitlab/test-connection \
  -H "Content-Type: application/json" \
  -d '{"token":"your-token","username":"your-username"}'
```

#### Check Connection Status
```bash
curl http://localhost:3000/api/gitlab/connection-status \
  -H "Cookie: next-auth.session-token=your-session-token"
```

#### Manual Sync
```bash
curl -X POST http://localhost:3000/api/gitlab/sync-commits \
  -H "Cookie: next-auth.session-token=your-session-token"
```

#### Get Analytics
```bash
curl http://localhost:3000/api/gitlab/intern-analytics \
  -H "Cookie: next-auth.session-token=your-session-token"
```

### Verification Checklist

After applying fixes, verify:

- [ ] Environment variables are correctly set
- [ ] GitLab connection shows "Connected" status
- [ ] Debug page shows correct API base URL
- [ ] Sync operation finds projects (check server logs)
- [ ] Commits are being processed and stored
- [ ] UI displays repositories and commits after sync
- [ ] Recent commits appear in the commits tab
- [ ] Analytics show correct metrics

### Additional Debug Tools

#### 1. Database Inspection
Check if data is being stored:
```javascript
// In MongoDB, check collections:
// - gitlabintegrations (connection data)
// - activitytrackings (commit data)
```

#### 2. Network Tab Inspection
1. Open browser DevTools → Network tab
2. Perform sync operation
3. Check API calls to `/api/gitlab/` endpoints
4. Verify response data structure

#### 3. React DevTools
Use React DevTools to inspect component state:
- Check `gitlabData` state in GitLabTab component
- Verify data flow from API to UI components

### Prevention

To prevent similar issues:
1. Always use environment variables for API endpoints
2. Add comprehensive logging to API routes
3. Create debug interfaces for complex integrations
4. Test with actual data from target GitLab instance
5. Implement proper error handling and user feedback

### Support

If issues persist:
1. Check server logs for detailed error messages
2. Use the debug page to identify specific failure points
3. Verify GitLab token permissions and validity
4. Ensure network connectivity to Swecha GitLab instance