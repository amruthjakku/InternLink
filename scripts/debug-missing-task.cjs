// CommonJS script to debug missing task
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

console.log('Using MongoDB URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  debugMissingTask();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function debugMissingTask() {
  try {
    const db = mongoose.connection.db;
    
    // Find the testme user
    const testmeUser = await db.collection('users').findOne({ 
      name: 'test me'
    });
    
    if (!testmeUser) {
      console.log('testme user not found');
      return;
    }
    
    const userIdString = testmeUser._id.toString();
    console.log(`\nDebugging tasks for user: ${testmeUser.name}`);
    console.log(`User ID: ${testmeUser._id}`);
    console.log(`User ID as string: ${userIdString}`);
    
    // Get all tasks assigned to testme user
    const allTestmeTasks = await db.collection('tasks').find({
      assignedTo: userIdString
    }).toArray();
    
    console.log(`\nAll tasks assigned to testme user: ${allTestmeTasks.length}`);
    allTestmeTasks.forEach((task, index) => {
      console.log(`${index + 1}. "${task.title}"`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Points: ${task.points}`);
      console.log(`   Progress: ${task.progress}%`);
      console.log(`   AssignedTo: ${task.assignedTo} (${typeof task.assignedTo})`);
      console.log('');
    });
    
    // Check the specific task query used by the API
    const taskQuery = {
      $or: [
        { assignedTo: userIdString }, // String comparison
        { assignedTo: testmeUser._id }, // ObjectId comparison
        { 'submissions.internId': testmeUser._id }
      ]
    };
    
    console.log('API Task query:', JSON.stringify(taskQuery, null, 2));
    
    const apiTasks = await db.collection('tasks').find(taskQuery).toArray();
    console.log(`\nTasks found by API query: ${apiTasks.length}`);
    
    // Check each status
    const completedTasks = apiTasks.filter(task => task.status === 'completed');
    const inProgressTasks = apiTasks.filter(task => task.status === 'in_progress');
    const doneTasks = apiTasks.filter(task => task.status === 'done');
    const approvedTasks = apiTasks.filter(task => task.status === 'approved');
    
    console.log(`\nTask status breakdown:`);
    console.log(`- Completed: ${completedTasks.length}`);
    console.log(`- In Progress: ${inProgressTasks.length}`);
    console.log(`- Done: ${doneTasks.length}`);
    console.log(`- Approved: ${approvedTasks.length}`);
    
    console.log(`\nTasks by status:`);
    apiTasks.forEach((task, index) => {
      console.log(`${index + 1}. "${task.title}" - Status: ${task.status}`);
    });
    
    // Check if the "Week 3: JavaScript Fundamentals" task exists
    const jsTask = await db.collection('tasks').findOne({
      title: 'Week 3: JavaScript Fundamentals',
      assignedTo: userIdString
    });
    
    if (jsTask) {
      console.log(`\n✅ Found "Week 3: JavaScript Fundamentals" task:`);
      console.log(`   Status: ${jsTask.status}`);
      console.log(`   Points: ${jsTask.points}`);
      console.log(`   AssignedTo: ${jsTask.assignedTo}`);
    } else {
      console.log(`\n❌ "Week 3: JavaScript Fundamentals" task not found`);
    }
    
    console.log('\nDebug completed');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error debugging missing task:', error);
    process.exit(1);
  }
}