# GitLab Integration Debug Test

## Issue Description
When clicking "Connect GitLab Account" button, it's showing something else instead of the expected form.

## Debug Steps

### 1. Check Console Errors
Open browser developer tools and check for JavaScript errors when clicking the button.

### 2. Verify Button Click Handler
The button should trigger `setShowTokenForm(true)` which shows the connection form.

### 3. Check State Management
Verify that the component state is properly managed:
- `showTokenForm` should toggle to `true`
- `isConnected` should be `false` initially
- No conflicting state updates

### 4. Test Component Isolation
Test the GitLabTab component in isolation to see if it works correctly.

## Expected Behavior

1. **Initial State**: Shows "Connect GitLab Account" button
2. **After Click**: Shows form with:
   - GitLab Username field
   - Personal Access Token field
   - Repository Names field (optional)
   - Connect Account button
   - Cancel button

## Debugging Code

Add this to GitLabTab.js for debugging:

```javascript
const handleConnectClick = () => {
  console.log('Connect button clicked');
  console.log('Current state:', { showTokenForm, isConnected, loading });
  setShowTokenForm(true);
  console.log('showTokenForm set to true');
};
```

Then use `onClick={handleConnectClick}` instead of `onClick={() => setShowTokenForm(true)}`

## Potential Issues

1. **Event Propagation**: Another event handler might be preventing the click
2. **State Conflict**: Another component might be interfering with state
3. **CSS/Layout**: The form might be rendered but hidden by CSS
4. **JavaScript Error**: An error might be preventing the state update

## Quick Fix Test

Try this simplified version of the connect button:

```javascript
<button
  onClick={() => {
    console.log('Button clicked!');
    alert('Button works!');
    setShowTokenForm(true);
  }}
  className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
>
  Connect GitLab Account
</button>
```

This will help identify if the issue is with the click handler or the form rendering.