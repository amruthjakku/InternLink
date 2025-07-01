// CommonJS script to check current tasks in database
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
  checkTasks();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Define Task model schema
const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: String,
  assignedTo: String,
  points: {
    type: Number,
    default: 10
  },
  progress: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Create Task model
const Task = mongoose.model('Task', TaskSchema);

// Define User model schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  cohortId: String,
  college: String
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function checkTasks() {
  try {
    // Get all tasks
    const allTasks = await Task.find({});
    console.log(`\nTotal tasks in database: ${allTasks.length}`);
    
    if (allTasks.length > 0) {
      console.log('\nFirst 5 tasks:');
      allTasks.slice(0, 5).forEach((task, index) => {
        console.log(`${index + 1}. Title: "${task.title}"`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Points: ${task.points}`);
        console.log(`   Progress: ${task.progress}`);
        console.log(`   Assigned To: ${task.assignedTo}`);
        console.log(`   Created: ${task.createdAt}`);
        console.log('');
      });
      
      // Check completed tasks
      const completedTasks = allTasks.filter(task => 
        task.status === 'completed' || 
        task.status === 'done' || 
        task.status === 'approved' ||
        (task.status === 'review' && task.progress >= 90)
      );
      
      console.log(`\nCompleted tasks: ${completedTasks.length}`);
      if (completedTasks.length > 0) {
        console.log('Completed tasks details:');
        completedTasks.forEach((task, index) => {
          console.log(`${index + 1}. "${task.title}" - Status: ${task.status}, Points: ${task.points}, Assigned To: ${task.assignedTo}`);
        });
      }
      
      // Check tasks with points
      const tasksWithPoints = allTasks.filter(task => task.points && task.points > 0);
      console.log(`\nTasks with points > 0: ${tasksWithPoints.length}`);
      
      // Check tasks without points
      const tasksWithoutPoints = allTasks.filter(task => !task.points || task.points === 0);
      console.log(`Tasks without points or with 0 points: ${tasksWithoutPoints.length}`);
    }
    
    // Get all users
    const allUsers = await User.find({});
    console.log(`\nTotal users in database: ${allUsers.length}`);
    
    const interns = allUsers.filter(user => user.role === 'intern');
    console.log(`Total interns: ${interns.length}`);
    
    if (interns.length > 0) {
      console.log('\nFirst 3 interns:');
      interns.slice(0, 3).forEach((intern, index) => {
        console.log(`${index + 1}. Name: ${intern.name || 'No name'}`);
        console.log(`   Email: ${intern.email}`);
        console.log(`   Cohort ID: ${intern.cohortId || 'No cohort'}`);
        console.log(`   College: ${intern.college || 'No college'}`);
        console.log('');
      });
      
      // Check tasks for first intern
      if (interns.length > 0) {
        const firstIntern = interns[0];
        const internTasks = allTasks.filter(task => task.assignedTo === firstIntern._id.toString());
        console.log(`\nTasks assigned to first intern (${firstIntern.name || firstIntern.email}): ${internTasks.length}`);
        
        if (internTasks.length > 0) {
          console.log('Tasks details:');
          internTasks.forEach((task, index) => {
            console.log(`${index + 1}. "${task.title}" - Status: ${task.status}, Points: ${task.points}, Progress: ${task.progress}`);
          });
          
          const completedInternTasks = internTasks.filter(task => 
            task.status === 'completed' || 
            task.status === 'done' || 
            task.status === 'approved' ||
            (task.status === 'review' && task.progress >= 90)
          );
          
          const totalPoints = completedInternTasks.reduce((sum, task) => sum + (task.points || 10), 0);
          console.log(`\nCompleted tasks for this intern: ${completedInternTasks.length}`);
          console.log(`Total points earned: ${totalPoints}`);
        }
      }
    }
    
    console.log('\nTask check completed successfully');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error checking tasks:', error);
    process.exit(1);
  }
}