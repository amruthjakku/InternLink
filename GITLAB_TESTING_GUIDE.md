# GitLab Integration Testing Guide

## 🚀 Quick Start Testing

### Step 1: Test GitLab API Connection
Visit: `http://localhost:3000/test-gitlab-connection`

This page will help you:
1. **Verify your Personal Access Token** works with Swecha GitLab
2. **Check API connectivity** to `https://code.swecha.org/api/v4`
3. **Validate token scopes** and permissions
4. **Debug connection issues** with detailed error messages

### Step 2: Test OAuth Flow (if signed in)
1. Visit: `http://localhost:3000/auth/signin`
2. Sign in with your Swecha GitLab account
3. Navigate to the intern dashboard GitLab tab
4. Look for "Quick Connect" option if OAuth is available

### Step 3: Test Personal Access Token Flow
1. Go to intern dashboard → GitLab tab
2. Click "Connect with Personal Access Token"
3. Use the token you tested in Step 1
4. Verify connection and data fetching

## 🔧 Creating a Personal Access Token

### Required Steps:
1. **Go to Swecha GitLab**: https://code.swecha.org/-/profile/personal_access_tokens
2. **Click "Add new token"**
3. **Token Name**: "InternLink Integration" (or any name you prefer)
4. **Expiration**: Set to a reasonable date (e.g., 1 year)
5. **Scopes**: Select these three scopes:
   - ✅ `read_user` - Read user profile information
   - ✅ `read_api` - Read access to the API
   - ✅ `read_repository` - Read access to repositories
6. **Click "Create personal access token"**
7. **Copy the token** (starts with `glpat-`) - you won't see it again!

### Token Format:
```
glpat-xxxxxxxxxxxxxxxxxxxx
```

## 🧪 Testing Scenarios

### Scenario 1: Valid Token Test
**Expected Result**: ✅ Connection successful
```
✅ Connection Successful!
User Information:
- Username: your-username
- Name: Your Full Name
- Email: your-email@example.com
- ID: 12345

Projects Access:
Found X accessible projects
• project-name-1 (group/project-name-1)
• project-name-2 (group/project-name-2)
```

### Scenario 2: Invalid Token Test
**Expected Result**: ❌ Connection failed
```
❌ Connection Failed
GitLab API Error (401): Unauthorized
```

### Scenario 3: Insufficient Scopes
**Expected Result**: ❌ Limited access or errors
```
❌ Connection Failed
GitLab API Error (403): Forbidden
```

### Scenario 4: Username Mismatch
**Expected Result**: ❌ Username validation error
```
❌ Connection Failed
Username mismatch: Token belongs to 'actual-username', but you entered 'wrong-username'
```

## 🔍 Troubleshooting Common Issues

### Issue 1: "Invalid Personal Access Token"
**Symptoms**: 401 Unauthorized error
**Causes**:
- Token is incorrect or has typos
- Token has been revoked
- Token has expired

**Solutions**:
1. Double-check the token (copy-paste carefully)
2. Create a new token
3. Verify token hasn't expired

### Issue 2: "Insufficient Permissions"
**Symptoms**: 403 Forbidden error or limited data
**Causes**:
- Token missing required scopes
- User doesn't have access to repositories

**Solutions**:
1. Recreate token with all required scopes:
   - `read_user`
   - `read_api` 
   - `read_repository`
2. Verify you have access to the repositories you want to track

### Issue 3: "Network Connection Error"
**Symptoms**: Network timeout or connection refused
**Causes**:
- Swecha GitLab instance is down
- Network connectivity issues
- Firewall blocking requests

**Solutions**:
1. Check if https://code.swecha.org is accessible in your browser
2. Try again later if the service is temporarily down
3. Check your network connection

### Issue 4: "Username Mismatch"
**Symptoms**: Token validation fails with username error
**Causes**:
- Entered wrong username
- Token belongs to different user

**Solutions**:
1. Leave username field empty (it's optional)
2. Enter the correct username that matches the token
3. Use the username shown in the error message

## 📊 Testing the Full Integration

### After Successful Token Test:

1. **Go to Intern Dashboard**:
   - Navigate to the GitLab tab
   - Should show connection options

2. **Connect Account**:
   - Use the tested token
   - Should see success message
   - Analytics should load

3. **Verify Data**:
   - Check commit history appears
   - Verify repository list is populated
   - Confirm analytics charts show data

4. **Test Features**:
   - Try manual sync
   - Switch between analytics tabs
   - Test disconnect functionality

## 🔄 OAuth Testing (Advanced)

### Prerequisites:
- User must be signed in with Swecha GitLab OAuth
- OAuth application must be properly configured

### Testing Steps:
1. **Sign in via OAuth**: Use the sign-in page
2. **Check OAuth Status**: Visit GitLab tab, look for "Quick Connect"
3. **Connect via OAuth**: Click the OAuth connect button
4. **Verify Integration**: Should connect without entering token

### OAuth Troubleshooting:
- **No OAuth option**: User not signed in with GitLab
- **OAuth fails**: Check environment variables and callback URL
- **Token expired**: User needs to re-authenticate

## 🛠️ Debug Tools

### 1. Connection Test Page
**URL**: `/test-gitlab-connection`
- Test token validity
- Check API connectivity
- Validate user information
- Debug connection issues

### 2. Diagnostic Page
**URL**: `/test-gitlab-diagnostic`
- System diagnostics
- Authentication checks
- Environment validation
- Interactive testing

### 3. Standalone GitLab Test
**URL**: `/test-gitlab`
- Test GitLab integration independently
- Bypass dashboard context
- Isolate functionality issues

## 📝 Test Checklist

### Basic Functionality ✅
- [ ] Personal Access Token creation
- [ ] Token validation via test page
- [ ] GitLab tab connection
- [ ] Data fetching (commits, projects)
- [ ] Analytics display

### OAuth Flow ✅
- [ ] OAuth sign-in
- [ ] Quick connect option
- [ ] OAuth-based connection
- [ ] Token storage and usage

### Error Handling ✅
- [ ] Invalid token handling
- [ ] Network error handling
- [ ] Insufficient permissions
- [ ] Username validation

### User Experience ✅
- [ ] Clear error messages
- [ ] Success notifications
- [ ] Loading states
- [ ] Intuitive interface

## 🎯 Success Criteria

### Connection Test Success:
```json
{
  "success": true,
  "message": "GitLab connection successful!",
  "user": {
    "username": "your-username",
    "name": "Your Name",
    "email": "your-email@example.com"
  },
  "projects": {
    "count": 5,
    "sample": [...]
  }
}
```

### Dashboard Integration Success:
- ✅ GitLab tab shows connected status
- ✅ Commit analytics display correctly
- ✅ Repository list populated
- ✅ Charts and metrics visible
- ✅ Manual sync works
- ✅ Disconnect functionality works

## 🚨 Known Issues & Workarounds

### Issue: Build Warnings
**Status**: Non-critical, app functions correctly
**Workaround**: Warnings don't affect functionality

### Issue: Static Generation Errors
**Status**: Expected for dynamic API routes
**Workaround**: Routes work correctly at runtime

### Issue: Diagnostic Page Auth Error
**Status**: Fixed with SessionProvider wrapper
**Solution**: Page now properly handles authentication

## 📞 Getting Help

### If Tests Fail:
1. **Check the test page results** for specific error messages
2. **Verify token scopes** are correct
3. **Confirm GitLab instance accessibility**
4. **Try creating a new token**
5. **Check network connectivity**

### Debug Information to Collect:
- Token test results (without exposing the actual token)
- Browser console errors
- Network tab API responses
- Environment configuration
- GitLab instance accessibility

### Contact Information:
- Include test results and error messages
- Specify which testing scenario failed
- Provide browser and system information
- Mention any custom configuration

## ✅ Final Verification

After completing all tests, you should have:

1. **✅ Working Personal Access Token** (tested via test page)
2. **✅ Successful GitLab Integration** (connected in dashboard)
3. **✅ Data Fetching** (commits and projects visible)
4. **✅ Analytics Display** (charts and metrics working)
5. **✅ OAuth Flow** (if applicable, quick connect working)

**🎉 Ready for Production!** Your GitLab integration is fully functional and ready to track intern progress.