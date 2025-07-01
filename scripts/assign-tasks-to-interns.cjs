// CommonJS script to assign existing tasks to interns for testing
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
  assignTasksToInterns();
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

async function assignTasksToInterns() {
  try {
    // Get all interns
    const interns = await User.find({ role: 'intern' });
    console.log(`Found ${interns.length} interns`);
    
    if (interns.length === 0) {
      console.log('No interns found. Cannot assign tasks.');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    // Get all tasks that are not assigned
    const unassignedTasks = await Task.find({ 
      $or: [
        { assignedTo: null },
        { assignedTo: { $exists: false } }
      ]
    });
    
    console.log(`Found ${unassignedTasks.length} unassigned tasks`);
    
    if (unassignedTasks.length === 0) {
      console.log('No unassigned tasks found.');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    // Assign tasks to interns (round-robin style)
    let assignmentCount = 0;
    
    for (let i = 0; i < unassignedTasks.length; i++) {
      const task = unassignedTasks[i];
      const intern = interns[i % interns.length]; // Round-robin assignment
      
      // Update the task with the assigned intern
      task.assignedTo = intern._id.toString();
      await task.save();
      
      console.log(`Assigned task "${task.title}" to ${intern.name || intern.email}`);
      assignmentCount++;
    }
    
    console.log(`\nSuccessfully assigned ${assignmentCount} tasks to ${interns.length} interns`);
    
    // Let's also mark one task as completed for each intern for testing
    console.log('\nMarking one task as completed for each intern for testing...');
    
    for (const intern of interns) {
      const internTasks = await Task.find({ assignedTo: intern._id.toString() });
      
      if (internTasks.length > 0) {
        const firstTask = internTasks[0];
        firstTask.status = 'completed';
        firstTask.progress = 100;
        await firstTask.save();
        
        console.log(`Marked task "${firstTask.title}" as completed for ${intern.name || intern.email} (${firstTask.points} points)`);
      }
    }
    
    console.log('\nTask assignment completed successfully');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error assigning tasks:', error);
    process.exit(1);
  }
}