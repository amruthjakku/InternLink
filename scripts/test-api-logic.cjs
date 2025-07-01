// CommonJS script to test the exact API logic
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
  testApiLogic();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Define models exactly as in the API
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

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  cohortId: mongoose.Schema.Types.ObjectId,
  college: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function testApiLogic() {
  try {
    // Simulate getting a current user (like the API does)
    const currentUser = await User.findOne({ role: 'intern' });
    if (!currentUser) {
      console.log('No intern found to test with');
      return;
    }
    
    console.log(`\nSimulating API for user: ${currentUser.name || currentUser.email}`);
    console.log(`User ID: ${currentUser._id}`);
    console.log(`User's college: ${currentUser.college}`);
    console.log(`User's cohort: ${currentUser.cohortId || 'No cohort'}`);
    
    // Test different scopes exactly as the API does
    const scopes = ['college', 'cohort', 'global'];
    
    for (const scope of scopes) {
      console.log(`\n=== TESTING ${scope.toUpperCase()} SCOPE ===`);
      
      // Build query based on scope (exactly as in API)
      let userQuery = { role: 'intern' };
      
      if (scope === 'cohort' && currentUser.cohortId) {
        userQuery.cohortId = currentUser.cohortId;
        console.log('Filtering by cohort:', currentUser.cohortId);
      } else if (scope === 'college' && currentUser.college) {
        userQuery.college = currentUser.college;
        console.log('Filtering by college:', currentUser.college);
      } else if (scope === 'cohort' && !currentUser.cohortId) {
        console.log('User has no cohort, this would return empty results');
        continue;
      }
      
      console.log('Query:', JSON.stringify(userQuery));
      
      // Get interns based on scope (exactly as in API)
      const interns = await User.find(userQuery);
      console.log(`Found ${interns.length} interns for ${scope} scope`);
      
      if (interns.length === 0) {
        console.log('No interns found for this scope');
        continue;
      }
      
      // Calculate leaderboard data (exactly as in API)
      const leaderboard = await Promise.all(interns.map(async (intern) => {
        const userId = intern._id.toString();
        
        // Get tasks data (exactly as in API)
        const taskQuery = { assignedTo: userId };
        console.log(`Fetching tasks for user ${intern.name || intern.email} with query:`, taskQuery);
        
        const allTasks = await Task.find(taskQuery);
        console.log(`Found ${allTasks.length} tasks for user ${intern.name || intern.email}`);
        
        // Get completed tasks (exactly as in API)
        const completedTasks = allTasks.filter(task => 
          task.status === 'completed' || 
          task.status === 'done' || 
          task.status === 'approved' ||
          (task.status === 'review' && task.progress >= 90)
        );
        
        console.log(`User ${intern.name || intern.email} has ${completedTasks.length} completed tasks out of ${allTasks.length} total tasks`);
        
        // Calculate points earned (exactly as in API)
        const pointsEarned = completedTasks.reduce((total, task) => {
          const taskPoints = task.points || 10;
          console.log(`Task "${task.title}" points: ${taskPoints}, status: ${task.status}, progress: ${task.progress}`);
          return total + taskPoints;
        }, 0);
        
        console.log(`Total points earned by ${intern.name || intern.email}: ${pointsEarned} from ${completedTasks.length} completed tasks`);
        
        return {
          id: intern._id,
          name: intern.name || intern.email.split('@')[0],
          college: intern.college,
          cohortId: intern.cohortId,
          tasksCompleted: completedTasks.length,
          totalTasks: allTasks.length,
          completionRate: allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0,
          pointsEarned: pointsEarned,
          isCurrentUser: intern._id.toString() === currentUser._id.toString()
        };
      }));
      
      // Sort by points earned (exactly as in API)
      leaderboard.sort((a, b) => b.pointsEarned - a.pointsEarned);
      
      // Update ranks (exactly as in API)
      leaderboard.forEach((intern, index) => {
        intern.rank = index + 1;
      });
      
      console.log(`\n${scope.toUpperCase()} LEADERBOARD:`);
      leaderboard.forEach((intern) => {
        console.log(`${intern.rank}. ${intern.name} - ${intern.pointsEarned} points (${intern.tasksCompleted}/${intern.totalTasks} tasks) ${intern.isCurrentUser ? '(YOU)' : ''}`);
      });
    }
    
    console.log('\nAPI logic test completed successfully');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error testing API logic:', error);
    process.exit(1);
  }
}