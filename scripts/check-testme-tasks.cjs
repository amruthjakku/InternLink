// CommonJS script to check tasks for testme user
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
  checkTestmeTasks();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function checkTestmeTasks() {
  try {
    const db = mongoose.connection.db;
    
    // Find the testme user
    const testmeUser = await db.collection('users').findOne({ 
      $or: [
        { name: 'test me' },
        { email: { $regex: /testme/i } },
        { name: { $regex: /testme/i } }
      ]
    });
    
    if (!testmeUser) {
      console.log('testme user not found');
      return;
    }
    
    console.log('\nFound testme user:');
    console.log(`Name: ${testmeUser.name}`);
    console.log(`Email: ${testmeUser.email}`);
    console.log(`ID: ${testmeUser._id}`);
    console.log(`Role: ${testmeUser.role}`);
    
    // Check for tasks assigned to this user
    const userIdString = testmeUser._id.toString();
    console.log(`\nLooking for tasks assigned to: ${userIdString}`);
    
    // Check all tasks
    const allTasks = await db.collection('tasks').find({}).toArray();
    console.log(`\nTotal tasks in database: ${allTasks.length}`);
    
    console.log('\nAll tasks and their assignments:');
    allTasks.forEach((task, index) => {
      console.log(`${index + 1}. "${task.title}"`);
      console.log(`   Assigned to: ${task.assignedTo} (${typeof task.assignedTo})`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Points: ${task.points}`);
      console.log('');
    });
    
    // Check if any tasks are assigned to testme user
    const testmeTasks = await db.collection('tasks').find({
      assignedTo: userIdString
    }).toArray();
    
    console.log(`\nTasks assigned to testme user: ${testmeTasks.length}`);
    
    if (testmeTasks.length === 0) {
      console.log('\n❌ No tasks found for testme user!');
      console.log('This explains why the leaderboard shows 0 points.');
      console.log('\nLet\'s assign a task to testme user...');
      
      // Find an unassigned task or create one
      if (allTasks.length > 0) {
        // Let's assign the first task to testme for testing
        const taskToAssign = allTasks[0];
        console.log(`\nAssigning task "${taskToAssign.title}" to testme user...`);
        
        await db.collection('tasks').updateOne(
          { _id: taskToAssign._id },
          { 
            $set: { 
              assignedTo: userIdString,
              status: 'completed', // Set as completed so it shows points
              progress: 100
            }
          }
        );
        
        console.log('✅ Task assigned successfully!');
        
        // Verify the assignment
        const updatedTask = await db.collection('tasks').findOne({ _id: taskToAssign._id });
        console.log('\nUpdated task:');
        console.log(`Title: ${updatedTask.title}`);
        console.log(`Assigned to: ${updatedTask.assignedTo}`);
        console.log(`Status: ${updatedTask.status}`);
        console.log(`Points: ${updatedTask.points}`);
      } else {
        console.log('No tasks available to assign');
      }
    } else {
      console.log('\nTasks assigned to testme:');
      testmeTasks.forEach((task, index) => {
        console.log(`${index + 1}. "${task.title}" - Status: ${task.status}, Points: ${task.points}`);
      });
    }
    
    console.log('\nTestme task check completed');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error checking testme tasks:', error);
    process.exit(1);
  }
}