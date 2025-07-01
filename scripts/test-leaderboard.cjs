// CommonJS script to test leaderboard logic
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
  testLeaderboard();
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

async function testLeaderboard() {
  try {
    // Get all interns
    const interns = await User.find({ role: 'intern' });
    console.log(`\nFound ${interns.length} interns`);
    
    // Calculate leaderboard data for each intern
    const leaderboard = await Promise.all(interns.map(async (intern) => {
      const userId = intern._id.toString();
      
      // Get tasks assigned to this intern
      const allTasks = await Task.find({ assignedTo: userId });
      
      // Get completed tasks
      const completedTasks = allTasks.filter(task => 
        task.status === 'completed' || 
        task.status === 'done' || 
        task.status === 'approved' ||
        (task.status === 'review' && task.progress >= 90)
      );
      
      // Calculate points earned
      const pointsEarned = completedTasks.reduce((total, task) => {
        return total + (task.points || 10);
      }, 0);
      
      console.log(`\nIntern: ${intern.name || intern.email}`);
      console.log(`  Total tasks: ${allTasks.length}`);
      console.log(`  Completed tasks: ${completedTasks.length}`);
      console.log(`  Points earned: ${pointsEarned}`);
      
      if (completedTasks.length > 0) {
        console.log(`  Completed task details:`);
        completedTasks.forEach(task => {
          console.log(`    - "${task.title}": ${task.points} points`);
        });
      }
      
      return {
        id: intern._id,
        name: intern.name || intern.email.split('@')[0],
        email: intern.email,
        tasksCompleted: completedTasks.length,
        totalTasks: allTasks.length,
        pointsEarned: pointsEarned,
        completionRate: allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0
      };
    }));
    
    // Sort by points earned
    leaderboard.sort((a, b) => b.pointsEarned - a.pointsEarned);
    
    console.log('\n=== LEADERBOARD (sorted by points) ===');
    leaderboard.forEach((intern, index) => {
      console.log(`${index + 1}. ${intern.name} - ${intern.pointsEarned} points (${intern.tasksCompleted}/${intern.totalTasks} tasks, ${intern.completionRate}% completion)`);
    });
    
    console.log('\nLeaderboard test completed successfully');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error testing leaderboard:', error);
    process.exit(1);
  }
}