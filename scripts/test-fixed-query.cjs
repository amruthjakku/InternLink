// CommonJS script to test the fixed query
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
  testFixedQuery();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Define Task model exactly as in the API
const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: String,
  assignedTo: mongoose.Schema.Types.ObjectId, // This expects ObjectId
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

// Define User model
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  cohortId: mongoose.Schema.Types.ObjectId,
  college: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function testFixedQuery() {
  try {
    // Get a sample user
    const sampleUser = await User.findOne({ role: 'intern' });
    if (!sampleUser) {
      console.log('No intern found to test with');
      return;
    }
    
    console.log(`\nTesting fixed query for user: ${sampleUser.name || sampleUser.email}`);
    console.log(`User ID: ${sampleUser._id} (ObjectId)`);
    console.log(`User ID as string: ${sampleUser._id.toString()}`);
    
    const userId = sampleUser._id.toString();
    
    // Test the old query (should find 0 tasks because of type mismatch)
    console.log('\n--- Testing OLD query (ObjectId field with string value) ---');
    const oldQuery = { assignedTo: userId };
    console.log('Old query:', oldQuery);
    const oldResults = await Task.find(oldQuery);
    console.log(`Old query found: ${oldResults.length} tasks`);
    
    // Test the new query (should find tasks because it handles both types)
    console.log('\n--- Testing NEW query (handles both string and ObjectId) ---');
    const newQuery = { 
      $or: [
        { assignedTo: userId }, // String comparison
        { assignedTo: sampleUser._id } // ObjectId comparison
      ]
    };
    console.log('New query:', JSON.stringify(newQuery, null, 2));
    const newResults = await Task.find(newQuery);
    console.log(`New query found: ${newResults.length} tasks`);
    
    if (newResults.length > 0) {
      console.log('\nTasks found with new query:');
      newResults.forEach((task, index) => {
        console.log(`${index + 1}. "${task.title}" - Status: ${task.status}, Points: ${task.points}, AssignedTo: ${task.assignedTo} (${typeof task.assignedTo})`);
      });
      
      // Calculate points for completed tasks
      const completedTasks = newResults.filter(task => 
        task.status === 'completed' || 
        task.status === 'done' || 
        task.status === 'approved' ||
        (task.status === 'review' && task.progress >= 90)
      );
      
      const totalPoints = completedTasks.reduce((sum, task) => sum + (task.points || 10), 0);
      console.log(`\nCompleted tasks: ${completedTasks.length}`);
      console.log(`Total points: ${totalPoints}`);
    }
    
    console.log('\nFixed query test completed successfully');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error testing fixed query:', error);
    process.exit(1);
  }
}