// Simple script to create sample weekly tasks via API
// Run this in browser console after logging in

const createSampleTask = async (weekNumber, title, description, subtasks = []) => {
  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        weekNumber,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        category: 'development',
        priority: 'medium',
        estimatedHours: 2,
        points: 20,
        subtasks: subtasks.map(sub => ({
          title: sub.title,
          description: sub.description || '',
          estimatedHours: sub.hours || 0.5,
          priority: sub.priority || 'medium'
        }))
      })
    });
    
    const result = await response.json();
    console.log(`Created task for Week ${weekNumber}:`, result);
    return result;
  } catch (error) {
    console.error(`Failed to create task for Week ${weekNumber}:`, error);
  }
};

// Run this function in browser console to create sample tasks
const createAllSampleTasks = async () => {
  console.log('🚀 Creating sample weekly tasks...');
  
  // Week 1 Tasks
  await createSampleTask(1, 'GitHub Profile Setup', 'Set up your professional GitHub profile', [
    { title: 'Create GitHub Account', description: 'Sign up with professional username' },
    { title: 'Upload Profile Picture', description: 'Add professional headshot' },
    { title: 'Write Bio', description: 'Craft compelling developer bio' }
  ]);
  
  await createSampleTask(1, 'Git Basics Practice', 'Learn fundamental Git commands', [
    { title: 'Initialize Repository', description: 'Create your first Git repo' },
    { title: 'Make First Commit', description: 'Add and commit your first file' },
    { title: 'Create Branch', description: 'Practice branching workflow' }
  ]);
  
  // Week 2 Tasks
  await createSampleTask(2, 'HTML/CSS Foundation', 'Build your first webpage', [
    { title: 'Create HTML Structure', description: 'Write semantic HTML markup' },
    { title: 'Add CSS Styling', description: 'Style your webpage with CSS' },
    { title: 'Make Responsive', description: 'Add mobile responsiveness' }
  ]);
  
  // Week 3 Tasks
  await createSampleTask(3, 'JavaScript Fundamentals', 'Learn JavaScript basics', [
    { title: 'Variables & Data Types', description: 'Practice JS basics' },
    { title: 'Functions & Loops', description: 'Write functions and loops' },
    { title: 'DOM Manipulation', description: 'Interact with webpage elements' }
  ]);
  
  console.log('✅ Sample weekly tasks created!');
  console.log('Go to Tasks → Weekly view to see them organized by weeks');
};

// Instructions
console.log(`
📋 SAMPLE WEEKLY TASKS CREATOR

To create sample tasks with subtasks:
1. Make sure you're logged in as admin/mentor
2. Run: createAllSampleTasks()
3. Go to Tasks tab and select "Weekly" view
4. Click on week headers to expand/collapse
5. Click on task subtasks to see detailed breakdown

Or create individual tasks:
createSampleTask(1, 'Task Title', 'Description', [
  { title: 'Subtask 1', description: 'Details' },
  { title: 'Subtask 2', description: 'More details' }
]);
`);