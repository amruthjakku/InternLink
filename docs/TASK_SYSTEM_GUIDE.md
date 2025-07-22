# Individual Task Progress System

## Overview

The AI developer InternLink platform now supports individual task progress tracking, allowing each intern to have their own progress status for shared tasks. This system ensures that when tasks are assigned to cohorts, each intern's progress is tracked separately.

## Key Features

### 1. Individual Progress Tracking
- Each intern has their own `TaskProgress` record for each assigned task
- Progress, status, and completion are tracked per intern
- Original tasks remain as templates/assignments

### 2. Shared Task Assignment
- Tasks can be assigned to entire cohorts
- All interns in a cohort see the same tasks
- Each intern's progress is independent

### 3. Personal Leaderboard
- Leaderboard ranks interns based on their individual task completions
- Points are earned individually based on personal progress
- No shared completion status affects individual rankings

## Data Models

### TaskProgress Model
```javascript
{
  taskId: ObjectId,           // Reference to the original task
  internId: ObjectId,         // Reference to the intern
  status: String,             // 'not_started', 'in_progress', 'review', 'completed', 'done'
  progress: Number,           // 0-100 percentage
  actualHours: Number,        // Time spent by this intern
  pointsEarned: Number,       // Points earned by this intern
  startedAt: Date,           // When intern started the task
  completedAt: Date,         // When intern completed the task
  submissionUrl: String,     // AI developer Intern's submission link
  submissionNotes: String,   // AI developer Intern's notes
  needsHelp: Boolean,        // Help request flag
  helpMessage: String,       // Help request message
  subtaskProgress: [{        // Individual subtask progress
    subtaskId: ObjectId,
    completed: Boolean,
    completedAt: Date,
    actualHours: Number
  }],
  timeLogs: [{              // Time tracking logs
    date: Date,
    hours: Number,
    description: String
  }]
}
```

### Task Model (Updated)
- Tasks remain as templates/assignments
- No longer store individual completion status
- Used as reference for task details and requirements

## API Endpoints

### Task Progress Management

#### Get Individual Progress
```
GET /api/tasks/[id]/progress
```
Returns the current user's progress for a specific task.

#### Update Progress
```
PATCH /api/tasks/[id]/progress
```
Updates progress percentage, status, submission details, etc.

#### Complete Task
```
PATCH /api/tasks/[id]/complete
```
Marks task as completed for the current user only.

#### Subtask Management
```
PATCH /api/tasks/[id]/subtasks/[subtaskId]
```
Updates individual subtask completion status.

### Admin/Tech Lead Endpoints

#### Progress Overview
```
GET /api/tasks/[id]/progress-overview
```
Shows progress of all interns for a specific task (mentors/admins only).

#### Admin Task Progress Management
```
GET /api/admin/task-progress
POST /api/admin/task-progress
```
Administrative tools for managing task progress system.

## Migration

### Running the Migration
To migrate existing task data to the new system:

```bash
node scripts/migrate-to-task-progress.js
```

This script will:
1. Find all existing tasks assigned to cohorts or individuals
2. Create `TaskProgress` records for each intern
3. Preserve existing completion status and progress data
4. Maintain backward compatibility

### Migration Options
- `--force`: Run migration even if existing TaskProgress records are found
- Default behavior: Skip migration if TaskProgress records already exist

## Usage Examples

### For AI developer Interns

#### Viewing Tasks
- Tasks API now returns individual progress information
- Each task shows personal status, progress, and completion details
- Subtasks show individual completion status

#### Completing Tasks
- Use the complete endpoint to mark tasks as done
- Progress is tracked individually
- Points are awarded based on personal completion

#### Updating Progress
- Update progress percentage (0-100%)
- Add submission URLs and notes
- Request help when needed

### For Tech Leads/Admins

#### Monitoring Progress
- View progress overview for any task
- See which interns need help
- Track completion rates across cohorts

#### Task Assignment
- Assign tasks to cohorts as before
- System automatically creates individual progress tracking
- Use bulk initialization for existing cohorts

## Benefits

### 1. Fair Assessment
- Each intern's progress is independent
- No shared completion status
- Individual effort is properly tracked

### 2. Better Tech Leading
- Tech Leads can see who needs help
- Individual progress monitoring
- Targeted support for struggling interns

### 3. Accurate Leaderboards
- Rankings based on individual achievements
- Points reflect personal effort
- Fair competition among interns

### 4. Detailed Analytics
- Track time spent per intern
- Monitor progress patterns
- Identify bottlenecks and challenges

## Best Practices

### 1. Task Creation
- Create tasks as templates for cohorts
- Set appropriate point values
- Include clear requirements and deliverables

### 2. Progress Monitoring
- Regularly check progress overviews
- Respond to help requests promptly
- Provide feedback on submissions

### 3. Data Management
- Run migration script before deploying
- Monitor system performance with new data model
- Regular cleanup of old progress records if needed

## Troubleshooting

### Common Issues

#### Missing Progress Records
- Use admin API to initialize progress for specific tasks/cohorts
- Check if migration was run properly
- Verify task assignment types

#### Inconsistent Data
- Check for duplicate TaskProgress records
- Verify task and intern references
- Use admin tools to clean up data

#### Performance Issues
- Monitor database indexes on TaskProgress collection
- Consider archiving old progress records
- Optimize queries for large cohorts

## Future Enhancements

### Planned Features
1. Batch progress updates
2. Progress templates for similar tasks
3. Automated progress calculation based on submissions
4. Integration with external assessment tools
5. Advanced analytics and reporting

### API Improvements
1. Bulk operations for admin tasks
2. Real-time progress updates
3. Webhook notifications for progress milestones
4. Export capabilities for progress data

## Support

For issues or questions about the TaskProgress system:
1. Check the troubleshooting section above
2. Review API documentation
3. Contact the development team
4. Submit issues through the project repository