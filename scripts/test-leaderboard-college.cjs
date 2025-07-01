// CommonJS script to test leaderboard logic with college scope
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
  testLeaderboardWithCollege();
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

async function testLeaderboardWithCollege() {
  try {
    // Simulate a current user (let's use the first intern)
    const currentUser = await User.findOne({ role: 'intern' });
    if (!currentUser) {
      console.log('No intern found to test with');
      return;
    }
    
    console.log(`\nTesting leaderboard for user: ${currentUser.name || currentUser.email}`);
    console.log(`User's college: ${currentUser.college}`);
    console.log(`User's cohort: ${currentUser.cohortId || 'No cohort'}`);
    
    // Test college scope
    console.log('\n=== TESTING COLLEGE SCOPE ===');
    let userQuery = { role: 'intern' };
    if (currentUser.college) {
      userQuery.college = currentUser.college;
      console.log('Filtering by college:', currentUser.college);
    }
    
    const internsInCollege = await User.find(userQuery);
    console.log(`Found ${internsInCollege.length} interns in the same college`);
    
    // Calculate leaderboard for college scope
    const collegeLeaderboard = await Promise.all(internsInCollege.map(async (intern) => {
      const userId = intern._id.toString();
      const allTasks = await Task.find({ assignedTo: userId });
      const completedTasks = allTasks.filter(task => 
        task.status === 'completed' || 
        task.status === 'done' || 
        task.status === 'approved' ||
        (task.status === 'review' && task.progress >= 90)
      );
      const pointsEarned = completedTasks.reduce((total, task) => total + (task.points || 10), 0);
      
      return {
        name: intern.name || intern.email.split('@')[0],
        pointsEarned: pointsEarned,
        tasksCompleted: completedTasks.length,
        totalTasks: allTasks.length
      };
    }));
    
    collegeLeaderboard.sort((a, b) => b.pointsEarned - a.pointsEarned);
    
    console.log('\nCollege Leaderboard:');
    collegeLeaderboard.forEach((intern, index) => {
      console.log(`${index + 1}. ${intern.name} - ${intern.pointsEarned} points (${intern.tasksCompleted}/${intern.totalTasks} tasks)`);
    });
    
    // Test cohort scope
    console.log('\n=== TESTING COHORT SCOPE ===');
    userQuery = { role: 'intern' };
    if (currentUser.cohortId) {
      userQuery.cohortId = currentUser.cohortId;
      console.log('Filtering by cohort:', currentUser.cohortId);
    } else {
      console.log('User has no cohort, this would return empty results');
    }
    
    const internsInCohort = await User.find(userQuery);
    console.log(`Found ${internsInCohort.length} interns in the same cohort`);
    
    if (internsInCohort.length > 0) {
      const cohortLeaderboard = await Promise.all(internsInCohort.map(async (intern) => {
        const userId = intern._id.toString();
        const allTasks = await Task.find({ assignedTo: userId });
        const completedTasks = allTasks.filter(task => 
          task.status === 'completed' || 
          task.status === 'done' || 
          task.status === 'approved' ||
          (task.status === 'review' && task.progress >= 90)
        );
        const pointsEarned = completedTasks.reduce((total, task) => total + (task.points || 10), 0);
        
        return {
          name: intern.name || intern.email.split('@')[0],
          pointsEarned: pointsEarned,
          tasksCompleted: completedTasks.length,
          totalTasks: allTasks.length
        };
      }));
      
      cohortLeaderboard.sort((a, b) => b.pointsEarned - a.pointsEarned);
      
      console.log('\nCohort Leaderboard:');
      cohortLeaderboard.forEach((intern, index) => {
        console.log(`${index + 1}. ${intern.name} - ${intern.pointsEarned} points (${intern.tasksCompleted}/${intern.totalTasks} tasks)`);
      });
    }
    
    console.log('\nLeaderboard test with scopes completed successfully');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error testing leaderboard:', error);
    process.exit(1);
  }
}