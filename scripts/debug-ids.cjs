// CommonJS script to debug ID types
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
  debugIds();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function debugIds() {
  try {
    const db = mongoose.connection.db;
    
    // Get raw user data to see the actual data types
    const users = await db.collection('users').find({ role: 'intern' }).limit(3).toArray();
    
    console.log('\nRaw user data from database:');
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User: ${user.name || user.email}`);
      console.log(`   _id: ${user._id} (type: ${typeof user._id})`);
      console.log(`   college: ${user.college} (type: ${typeof user.college})`);
      console.log(`   cohortId: ${user.cohortId} (type: ${typeof user.cohortId})`);
      console.log(`   role: ${user.role} (type: ${typeof user.role})`);
    });
    
    // Test different query approaches
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\nTesting queries for user: ${testUser.name || testUser.email}`);
      console.log(`College ID to search for: ${testUser.college}`);
      
      // Test 1: Direct string comparison
      console.log('\n--- Test 1: Direct string comparison ---');
      const result1 = await db.collection('users').find({ 
        role: 'intern', 
        college: testUser.college 
      }).toArray();
      console.log(`Found ${result1.length} users with direct string comparison`);
      
      // Test 2: ObjectId comparison
      console.log('\n--- Test 2: ObjectId comparison ---');
      try {
        const { ObjectId } = require('mongodb');
        const collegeObjectId = new ObjectId(testUser.college);
        const result2 = await db.collection('users').find({ 
          role: 'intern', 
          college: collegeObjectId 
        }).toArray();
        console.log(`Found ${result2.length} users with ObjectId comparison`);
      } catch (error) {
        console.log('ObjectId conversion failed:', error.message);
      }
      
      // Test 3: Check all interns regardless of college
      console.log('\n--- Test 3: All interns ---');
      const result3 = await db.collection('users').find({ role: 'intern' }).toArray();
      console.log(`Found ${result3.length} total interns`);
      
      // Show college values for all interns
      console.log('\nCollege values for all interns:');
      result3.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || user.email}: college = "${user.college}" (${typeof user.college})`);
      });
    }
    
    console.log('\nID debugging completed successfully');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error debugging IDs:', error);
    process.exit(1);
  }
}