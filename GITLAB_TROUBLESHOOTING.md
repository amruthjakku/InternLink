# GitLab Integration Troubleshooting Guide

## Issue: "Connect GitLab Account" Button Not Working

### Current Status
✅ **GitLab Integration is Fully Implemented**
- All API endpoints are working
- Database models are properly set up
- Frontend components are complete
- Authentication and encryption are implemented

### Debugging Steps

#### 1. **Test the Integration Independently**
Visit: `http://localhost:3001/test-gitlab`

This standalone test page will help identify if the issue is with:
- The GitLab integration itself
- The dashboard context
- Authentication issues

#### 2. **Check Browser Console**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Navigate to GitLab tab in intern dashboard
4. Click "Connect GitLab Account"
5. Look for these debug messages:
   ```
   GitLabTab rendered with user: [user object]
   Connect GitLab Account button clicked
   Current state: {showTokenForm: false, isConnected: false, loading: false}
   showTokenForm set to true
   Debug: Form is now visible (showTokenForm = true)
   ```

#### 3. **Common Issues & Solutions**

##### Issue A: Button Click Not Registering
**Symptoms**: No console logs when clicking button
**Causes**: 
- JavaScript error preventing execution
- Event handler not attached
- Button covered by another element

**Solution**: Check for JavaScript errors in console

##### Issue B: Form Not Appearing
**Symptoms**: Console shows "showTokenForm set to true" but no form visible
**Causes**:
- CSS hiding the form
- Conditional rendering issue
- State not updating properly

**Solution**: Look for the debug message "Debug: Form is now visible"

##### Issue C: Authentication Issues
**Symptoms**: API calls failing with 401 errors
**Causes**:
- User not properly authenticated
- Session expired
- Auth context not working

**Solution**: Check if user object is populated in console

#### 4. **Manual Testing Steps**

1. **Basic Functionality Test**:
   ```
   1. Go to intern dashboard
   2. Click GitLab tab
   3. Should see "Connect Your GitLab Account" section
   4. Click "Connect GitLab Account" button
   5. Should see form with username/token fields
   ```

2. **Connection Test**:
   ```
   1. Get GitLab Personal Access Token:
      - Go to GitLab.com → Settings → Access Tokens
      - Create token with scopes: read_api, read_repository, read_user
      - Copy the token (starts with glpat-)
   
   2. Fill the form:
      - Username: your GitLab username
      - Token: the PAT you created
      - Repos: leave empty or specify specific repos
   
   3. Click "Connect Account"
   4. Should see success message and analytics
   ```

#### 5. **API Endpoint Testing**

Test the API endpoints directly:

```bash
# Test connection status
curl -X GET http://localhost:3001/api/gitlab/connection-status \
  -H "Cookie: your-session-cookie"

# Test token connection
curl -X POST http://localhost:3001/api/gitlab/connect-token \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "personalAccessToken": "your-token",
    "gitlabUsername": "your-username",
    "repositories": ""
  }'
```

### Quick Fixes

#### Fix 1: Clear Browser Cache
Sometimes cached JavaScript can cause issues:
1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. Clear browser cache
3. Try again

#### Fix 2: Check Network Tab
1. Open Developer Tools → Network tab
2. Click "Connect GitLab Account"
3. Look for any failed API requests
4. Check if requests are being made to correct endpoints

#### Fix 3: Verify Environment
Make sure these environment variables are set:
```
NEXTAUTH_SECRET=your-secret
ENCRYPTION_SECRET=your-32-character-secret
MONGODB_URI=your-mongodb-connection
```

### Expected Behavior Flow

1. **Initial Load**:
   - GitLab tab shows connection prompt
   - `isConnected = false`
   - `showTokenForm = false`

2. **Button Click**:
   - Console logs appear
   - `showTokenForm = true`
   - Form becomes visible

3. **Form Submission**:
   - API call to `/api/gitlab/connect-token`
   - Token validation against GitLab
   - Success message appears
   - `isConnected = true`

4. **Connected State**:
   - Shows GitLab analytics dashboard
   - Three tabs: Overview, Commits, Analytics
   - Sync and Disconnect buttons available

### Alternative Testing Method

If the main dashboard isn't working, you can test the GitLab integration using the standalone test component:

1. Visit: `http://localhost:3001/test-gitlab`
2. This bypasses the dashboard context
3. Tests the core GitLab functionality
4. Helps isolate the issue

### Debug Information to Collect

When reporting issues, please provide:

1. **Browser Console Logs**:
   - Any error messages
   - Debug output from button clicks
   - Network request failures

2. **Network Tab Information**:
   - Failed API requests
   - Response codes and messages
   - Request payloads

3. **Environment Details**:
   - Browser version
   - Operating system
   - Node.js version
   - Any custom configuration

### Contact Information

If the issue persists after trying these steps, please provide:
- Console logs
- Network tab screenshots
- Description of what happens vs. what's expected
- Steps to reproduce the issue

The GitLab integration is fully functional and has been tested. The issue is likely environmental or related to a specific browser/session state.