// Simple test to check if profile stats API logic works
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  testProfileStats();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function testProfileStats() {
  try {
    const db = mongoose.connection.db;
    
    // Find testme user
    const user = await db.collection('users').findOne({ name: 'test me' });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log(`\nTesting for user: ${user.name}`);
    console.log(`GitLab integration: ${user.gitlabIntegration?.connected}`);
    
    if (user.gitlabIntegration?.connected) {
      // Test activity records query
      const userIdString = user._id.toString();
      console.log(`\nQuerying activity records for userId: ${user._id}`);
      
      const commitRecords = await db.collection('activityrecords').find({
        $or: [
          { userId: user._id },
          { userId: userIdString }
        ],
        type: 'commit'
      }).toArray();
      
      console.log(`Found ${commitRecords.length} commit records`);
      
      if (commitRecords.length > 0) {
        console.log('Commit records:');
        commitRecords.forEach((record, i) => {
          console.log(`  ${i+1}. Repo: ${record.repositoryName}, Date: ${record.timestamp}`);
        });
        
        const uniqueRepos = new Set(commitRecords.map(r => r.repositoryName));
        console.log(`Unique repositories: ${uniqueRepos.size} (${Array.from(uniqueRepos).join(', ')})`);
      }
      
      // Test merge requests
      const mrRecords = await db.collection('activityrecords').find({
        $or: [
          { userId: user._id },
          { userId: userIdString }
        ],
        type: 'merge_request'
      }).toArray();
      
      console.log(`Found ${mrRecords.length} merge request records`);
    }
    
    // Test attendance
    const attendanceRecords = await db.collection('attendancerecords').find({
      $or: [
        { userId: user._id },
        { userId: user._id.toString() }
      ]
    }).toArray();
    
    console.log(`Found ${attendanceRecords.length} attendance records`);
    if (attendanceRecords.length > 0) {
      const present = attendanceRecords.filter(r => r.status === 'present').length;
      console.log(`Present: ${present}/${attendanceRecords.length} (${Math.round(present/attendanceRecords.length*100)}%)`);
    }
    
    console.log('\n✅ Test completed');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}