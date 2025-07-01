// CommonJS script to test raw MongoDB queries
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
  testRawQuery();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function testRawQuery() {
  try {
    const db = mongoose.connection.db;
    
    // Get a sample user
    const sampleUser = await db.collection('users').findOne({ role: 'intern' });
    if (!sampleUser) {
      console.log('No intern found to test with');
      return;
    }
    
    console.log(`\nTesting raw queries for user: ${sampleUser.name || sampleUser.email}`);
    console.log(`User ID: ${sampleUser._id} (${typeof sampleUser._id})`);
    console.log(`User ID as string: ${sampleUser._id.toString()}`);
    
    const userIdString = sampleUser._id.toString();
    const userIdObjectId = sampleUser._id;
    
    // Test 1: Query with string (this should work since our data is stored as strings)
    console.log('\n--- Test 1: Query with string ---');
    const stringQuery = { assignedTo: userIdString };
    console.log('String query:', stringQuery);
    const stringResults = await db.collection('tasks').find(stringQuery).toArray();
    console.log(`String query found: ${stringResults.length} tasks`);
    
    // Test 2: Query with ObjectId (this should not work since our data is stored as strings)
    console.log('\n--- Test 2: Query with ObjectId ---');
    const objectIdQuery = { assignedTo: userIdObjectId };
    console.log('ObjectId query:', objectIdQuery);
    const objectIdResults = await db.collection('tasks').find(objectIdQuery).toArray();
    console.log(`ObjectId query found: ${objectIdResults.length} tasks`);
    
    // Test 3: $or query with both types
    console.log('\n--- Test 3: $or query with both types ---');
    const orQuery = { 
      $or: [
        { assignedTo: userIdString },
        { assignedTo: userIdObjectId }
      ]
    };
    console.log('$or query:', JSON.stringify(orQuery, null, 2));
    const orResults = await db.collection('tasks').find(orQuery).toArray();
    console.log(`$or query found: ${orResults.length} tasks`);
    
    if (orResults.length > 0) {
      console.log('\nTasks found:');
      orResults.forEach((task, index) => {
        console.log(`${index + 1}. "${task.title}"`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Points: ${task.points}`);
        console.log(`   AssignedTo: ${task.assignedTo} (${typeof task.assignedTo})`);
        console.log('');
      });
    }
    
    // Test 4: Check what tasks exist for any user
    console.log('\n--- Test 4: All tasks with assignedTo field ---');
    const allAssignedTasks = await db.collection('tasks').find({ 
      assignedTo: { $exists: true, $ne: null } 
    }).toArray();
    console.log(`Found ${allAssignedTasks.length} tasks with assignedTo field`);
    
    if (allAssignedTasks.length > 0) {
      console.log('\nFirst few assigned tasks:');
      allAssignedTasks.slice(0, 3).forEach((task, index) => {
        console.log(`${index + 1}. "${task.title}" assigned to ${task.assignedTo} (${typeof task.assignedTo})`);
      });
    }
    
    console.log('\nRaw query test completed successfully');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error testing raw query:', error);
    process.exit(1);
  }
}