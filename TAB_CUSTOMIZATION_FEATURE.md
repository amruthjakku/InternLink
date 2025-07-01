# Tab Reordering Feature

## Overview
The Tab Reordering feature allows each intern to personalize their dashboard by rearranging tabs in their preferred order. The feature works just like browser tabs - simply long press and drag to reorder. These preferences are saved to their personal profile and persist across sessions.

## 🚀 Key Features

### 1. **Simple Tab Reordering**
- **Long Press & Drag**: Just like browser tabs - long press any tab and drag to reorder
- **Visual Feedback**: Tab becomes semi-transparent and slightly larger when being dragged
- **Real-time Reordering**: See changes immediately as you drag
- **Persistent Order**: Tab order is automatically saved and restored on next login
- **Cross-Platform**: Works on both desktop (mouse) and mobile (touch) devices

### 2. **User Experience**
- **Intuitive Interface**: No complex menus or settings - just long press and drag
- **Haptic Feedback**: Mobile devices vibrate when drag mode is activated
- **Visual Cues**: Clear cursor changes and visual feedback during dragging
- **Automatic Saving**: Changes are saved automatically when you finish dragging

## 🛠️ Technical Implementation

### Database Schema
```javascript
// User Model - dashboardPreferences field
dashboardPreferences: {
  tabOrder: {
    type: [String],
    default: ['progress', 'tasks', 'performance', 'gitlab', 'meetings', 'profile', 'leaderboard', 'attendance', 'chat', 'ai-assistant']
  }
}
```

### API Endpoints

#### GET `/api/user/preferences`
- **Purpose**: Retrieve user's current tab order
- **Response**: Returns tabOrder array
- **Authentication**: Required (session-based)

#### PUT `/api/user/preferences`
- **Purpose**: Update user's tab order
- **Body**: `{ preferences: { tabOrder: [...] } }`
- **Validation**: Ensures valid tab names
- **Response**: Updated preferences object

#### POST `/api/user/preferences`
- **Purpose**: Reset tab order to system defaults
- **Response**: Default preferences object

### Frontend Implementation

#### `InternDashboard.js` Updates
- **Long Press Detection**: 500ms timer for long press activation
- **Drag State Management**: Tracks dragging state and dragged tab
- **Visual Feedback**: Opacity and scale changes during drag
- **Touch Support**: Full mobile touch event handling
- **Automatic Saving**: Saves order when drag ends
- **Cross-Platform**: Mouse and touch event support

## 📋 Available Tabs

| Tab ID | Name | Icon | Description |
|--------|------|------|-------------|
| `progress` | Progress | 📊 | Dashboard overview and progress tracking |
| `tasks` | Tasks | 📝 | Manage assigned tasks |
| `performance` | Performance | 📈 | Track performance metrics |
| `gitlab` | GitLab | 🦊 | GitLab activity and repositories |
| `meetings` | Meetings | 📹 | Schedule and join meetings |
| `profile` | Profile | 👤 | Manage profile settings |
| `leaderboard` | Leaderboard | 🏆 | View performance rankings |
| `attendance` | Attendance | 📍 | Mark attendance |
| `chat` | Chat | 💬 | Chat with mentors and peers |
| `ai-assistant` | AI Assistant | 🤖 | Get AI-powered assistance |

## 🎯 User Benefits

### Personalization
- **Custom Workflow**: Arrange tabs to match personal workflow
- **Prioritized Access**: Put most important tabs first
- **Familiar Experience**: Works just like browser tab reordering

### Productivity
- **Efficient Layout**: Optimize dashboard for individual needs
- **Consistent Experience**: Same layout across all sessions
- **Quick Access**: Frequently used tabs can be moved to the front

### Flexibility
- **Easy Changes**: Reorder tabs anytime with simple long press and drag
- **Instant Feedback**: See changes immediately
- **Automatic Persistence**: No need to manually save changes

## 🔧 Usage Instructions

### For Interns

#### Reordering Tabs
1. **Desktop (Mouse)**:
   - Long press (hold down) on any tab for 500ms
   - Tab will become semi-transparent and slightly larger
   - Drag the tab to your desired position
   - Release to drop the tab in the new position
   - Changes are saved automatically

2. **Mobile (Touch)**:
   - Long press on any tab for 500ms
   - Device will vibrate to confirm drag mode is active
   - Drag the tab to your desired position
   - Lift your finger to drop the tab
   - Changes are saved automatically

#### Visual Feedback
- **Long Press Activation**: Tab becomes 50% transparent and scales up slightly
- **Cursor Changes**: Mouse cursor changes to grabbing hand during drag
- **Mobile Haptics**: Phone vibrates when drag mode activates
- **Instructions**: "Long press and drag to reorder tabs" shown on desktop

### For Administrators

#### Monitoring Usage
- User tab orders are stored in the database
- Can be viewed/modified through direct database access
- No admin interface currently available

#### Adding New Tabs
1. Update `allTabs` object in `InternDashboard.js`
2. Add tab ID to default order in User model
3. Add tab validation to API endpoint
4. Update documentation

## 🔒 Security & Validation

### Input Validation
- **Tab Names**: Only predefined tab IDs are accepted
- **Array Integrity**: Ensures arrays contain valid strings
- **Complete Set**: All valid tabs must be present in the order

### Data Persistence
- **User-Specific**: Each user's tab order is isolated
- **Session Independent**: Tab order persists across sessions
- **Graceful Fallbacks**: System handles missing/invalid data with defaults

### Error Handling
- **API Errors**: Graceful error messages for failed saves
- **Invalid States**: Automatic fallback to default order
- **Network Issues**: Local state preservation during connectivity issues

## 🚀 Future Enhancements

### Planned Features
1. **Tab Hiding**: Allow users to hide tabs they don't use
2. **Default Tab Setting**: Set which tab opens first on login
3. **Quick Reset**: One-click reset to default order
4. **Admin Defaults**: Allow admins to set organization-wide default orders
5. **Keyboard Shortcuts**: Keyboard shortcuts for tab reordering

### Advanced Features
1. **Tab Groups**: Organize tabs into collapsible groups
2. **Tab Colors**: Custom color themes for tabs
3. **Tab Notifications**: Badge counts and notification indicators
4. **Gesture Support**: Swipe gestures for mobile tab switching

## 📊 Analytics & Insights

### Usage Tracking (Future)
- Most popular tab arrangements
- Frequency of tab reordering
- Most commonly prioritized tabs
- User engagement metrics

### Performance Monitoring
- Load time impact of customization
- Database query optimization
- Drag and drop performance metrics

## 🐛 Troubleshooting

### Common Issues

#### Tab Order Not Saving
- **Check Network**: Ensure stable internet connection
- **Refresh Page**: Try refreshing and reordering again
- **Clear Cache**: Clear browser cache and cookies

#### Long Press Not Working
- **Timing**: Make sure to hold for full 500ms
- **Mobile Issues**: Ensure touch events are not blocked
- **Browser Compatibility**: Try different browser

#### Drag Not Responsive
- **Complete the Drag**: Make sure to drag over another tab
- **Release Properly**: Ensure clean mouse up or touch end
- **Page Refresh**: Try refreshing if drag state gets stuck

### Support Information
- **Documentation**: This file and inline help text
- **Error Messages**: Detailed error messages in development mode
- **Console Logs**: Check browser console for debugging info

## 📝 Development Notes

### Code Structure
```
components/
├── InternDashboard.js          # Main dashboard with drag/drop logic
app/api/user/preferences/
└── route.js                    # API endpoints for tab order
models/
└── User.js                     # Database schema with tab order
```

### Key Functions
- `loadUserPreferences()`: Loads tab order from API
- `saveUserPreferences()`: Saves tab order to API
- `handlePressStart()`: Initiates long press detection
- `handleDragOver()`: Handles tab reordering during drag
- `handleDragEnd()`: Completes drag and saves order
- `getOrderedTabs()`: Returns tabs in user's preferred order

### State Management
- `tabOrder`: Array of tab IDs in user's preferred order
- `draggedTab`: Currently dragged tab ID
- `isDragging`: Boolean flag for drag state
- `longPressTimer`: Timer for long press detection

### Event Handling
- Mouse events for desktop drag and drop
- Touch events for mobile drag and drop
- Cross-platform compatibility
- Haptic feedback on mobile devices

This feature provides a simple, intuitive way for users to personalize their dashboard tab order with familiar browser-like drag and drop functionality.