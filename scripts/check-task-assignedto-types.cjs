// CommonJS script to check assignedTo field types
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
  checkAssignedToTypes();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function checkAssignedToTypes() {
  try {
    const db = mongoose.connection.db;
    
    // Get raw task data to see the actual data types
    const tasks = await db.collection('tasks').find({}).toArray();
    
    console.log(`\nFound ${tasks.length} tasks in database`);
    
    tasks.forEach((task, index) => {
      console.log(`\n${index + 1}. Task: "${task.title}"`);
      console.log(`   _id: ${task._id} (type: ${typeof task._id})`);
      console.log(`   assignedTo: ${task.assignedTo} (type: ${typeof task.assignedTo})`);
      console.log(`   status: ${task.status}`);
      console.log(`   points: ${task.points}`);
    });
    
    // Check if any tasks have assignedTo as ObjectId vs string
    const tasksWithObjectIdAssignedTo = tasks.filter(task => 
      task.assignedTo && typeof task.assignedTo === 'object'
    );
    
    const tasksWithStringAssignedTo = tasks.filter(task => 
      task.assignedTo && typeof task.assignedTo === 'string'
    );
    
    console.log(`\nTasks with ObjectId assignedTo: ${tasksWithObjectIdAssignedTo.length}`);
    console.log(`Tasks with string assignedTo: ${tasksWithStringAssignedTo.length}`);
    
    // Get a sample user ID to compare
    const users = await db.collection('users').find({ role: 'intern' }).limit(1).toArray();
    if (users.length > 0) {
      const sampleUser = users[0];
      console.log(`\nSample user ID: ${sampleUser._id} (type: ${typeof sampleUser._id})`);
      
      // Test different query approaches
      console.log('\n--- Testing query approaches ---');
      
      // Test 1: String comparison
      const result1 = await db.collection('tasks').find({ 
        assignedTo: sampleUser._id.toString() 
      }).toArray();
      console.log(`Query with string ID: Found ${result1.length} tasks`);
      
      // Test 2: ObjectId comparison
      const result2 = await db.collection('tasks').find({ 
        assignedTo: sampleUser._id 
      }).toArray();
      console.log(`Query with ObjectId: Found ${result2.length} tasks`);
    }
    
    console.log('\nAssignedTo type check completed successfully');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error checking assignedTo types:', error);
    process.exit(1);
  }
}