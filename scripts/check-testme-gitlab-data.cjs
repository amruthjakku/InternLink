// CommonJS script to check testme user's GitLab data
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
  checkGitLabData();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function checkGitLabData() {
  try {
    const db = mongoose.connection.db;
    
    // Find the testme user
    const testmeUser = await db.collection('users').findOne({ 
      name: 'test me'
    });
    
    if (!testmeUser) {
      console.log('testme user not found');
      return;
    }
    
    console.log('\nTestme user GitLab data:');
    console.log(`Name: ${testmeUser.name}`);
    console.log(`Email: ${testmeUser.email}`);
    console.log(`ID: ${testmeUser._id}`);
    console.log(`GitLab Username: ${testmeUser.gitlabUsername || 'Not set'}`);
    console.log(`GitLab Email: ${testmeUser.gitlabEmail || 'Not set'}`);
    console.log(`GitLab Avatar URL: ${testmeUser.gitlabAvatarUrl || 'Not set'}`);
    console.log(`GitLab Profile URL: ${testmeUser.gitlabProfileUrl || 'Not set'}`);
    console.log(`GitLab Integration:`, testmeUser.gitlabIntegration || 'Not set');
    
    // Check activity records
    console.log('\n--- Activity Records ---');
    const activityRecords = await db.collection('activityrecords').find({
      userId: testmeUser._id
    }).toArray();
    console.log(`Total activity records: ${activityRecords.length}`);
    
    if (activityRecords.length > 0) {
      console.log('Activity records:');
      activityRecords.forEach((record, index) => {
        console.log(`${index + 1}. Type: ${record.type}, Repository: ${record.repositoryName || 'N/A'}, Date: ${record.timestamp || record.createdAt}`);
      });
    }
    
    // Check attendance records
    console.log('\n--- Attendance Records ---');
    const attendanceRecords = await db.collection('attendancerecords').find({
      userId: testmeUser._id
    }).toArray();
    console.log(`Total attendance records: ${attendanceRecords.length}`);
    
    if (attendanceRecords.length > 0) {
      console.log('Attendance records:');
      attendanceRecords.forEach((record, index) => {
        console.log(`${index + 1}. Status: ${record.status}, Date: ${record.date}, Time: ${record.timestamp}`);
      });
    }
    
    // Let's create some sample data for testing
    console.log('\n--- Creating Sample Data ---');
    
    // Update user with GitLab integration
    await db.collection('users').updateOne(
      { _id: testmeUser._id },
      {
        $set: {
          gitlabIntegration: {
            connected: true,
            lastSync: new Date(),
            accessToken: 'sample_token' // This would be real in production
          }
        }
      }
    );
    console.log('✅ Updated user with GitLab integration');
    
    // Create sample activity records (commits)
    const sampleActivities = [
      {
        userId: testmeUser._id,
        type: 'commit',
        repositoryName: 'week1',
        commitHash: 'abc123',
        message: 'Initial commit for week 1 project',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        userId: testmeUser._id,
        type: 'commit',
        repositoryName: 'week1',
        commitHash: 'def456',
        message: 'Added CSS styling',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        userId: testmeUser._id,
        type: 'commit',
        repositoryName: 'portfolio',
        commitHash: 'ghi789',
        message: 'Updated portfolio design',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        userId: testmeUser._id,
        type: 'merge_request',
        repositoryName: 'week1',
        title: 'Feature: Add responsive design',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];
    
    await db.collection('activityrecords').insertMany(sampleActivities);
    console.log(`✅ Created ${sampleActivities.length} sample activity records`);
    
    // Create sample attendance records
    const sampleAttendance = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      sampleAttendance.push({
        userId: testmeUser._id,
        date: date.toISOString().split('T')[0],
        status: i < 8 ? 'present' : 'absent', // 80% attendance
        timestamp: date,
        createdAt: date
      });
    }
    
    await db.collection('attendancerecords').insertMany(sampleAttendance);
    console.log(`✅ Created ${sampleAttendance.length} sample attendance records`);
    
    console.log('\n🎉 Sample data created! The profile card should now show updated stats.');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error checking GitLab data:', error);
    process.exit(1);
  }
}