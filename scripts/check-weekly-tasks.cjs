// CommonJS script to check weekly tasks in database
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
  checkWeeklyTasks();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function checkWeeklyTasks() {
  try {
    const db = mongoose.connection.db;
    
    // Check weekly tasks collection
    const weeklyTasks = await db.collection('weeklytasks').find({}).toArray();
    console.log(`\nTotal weekly tasks in database: ${weeklyTasks.length}`);
    
    if (weeklyTasks.length > 0) {
      console.log('\nFirst 3 weekly tasks:');
      weeklyTasks.slice(0, 3).forEach((task, index) => {
        console.log(`${index + 1}. Title: "${task.title}"`);
        console.log(`   Assignment Type: ${task.assignmentType}`);
        console.log(`   Points: ${task.points}`);
        console.log(`   Is Active: ${task.isActive}`);
        console.log(`   Is Published: ${task.isPublished}`);
        console.log(`   Cohort ID: ${task.cohortId}`);
        console.log(`   Assigned To: ${task.assignedTo}`);
        console.log('');
      });
      
      const activeTasks = weeklyTasks.filter(task => task.isActive && task.isPublished);
      console.log(`Active and published weekly tasks: ${activeTasks.length}`);
    }
    
    // Check task submissions collection
    const taskSubmissions = await db.collection('tasksubmissions').find({}).toArray();
    console.log(`\nTotal task submissions: ${taskSubmissions.length}`);
    
    if (taskSubmissions.length > 0) {
      console.log('\nFirst 3 task submissions:');
      taskSubmissions.slice(0, 3).forEach((submission, index) => {
        console.log(`${index + 1}. Task ID: ${submission.taskId}`);
        console.log(`   User ID: ${submission.userId}`);
        console.log(`   Status: ${submission.status}`);
        console.log(`   Progress: ${submission.progress}`);
        console.log(`   Points Earned: ${submission.pointsEarned}`);
        console.log(`   Submitted At: ${submission.submittedAt}`);
        console.log('');
      });
    }
    
    // Check collections list
    const collections = await db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    console.log('\nWeekly tasks check completed successfully');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error checking weekly tasks:', error);
    process.exit(1);
  }
}