// CommonJS script to debug profile stats API
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
  debugProfileStatsAPI();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function debugProfileStatsAPI() {
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
    
    console.log(`\nDebugging profile stats API for user: ${testmeUser.name}`);
    console.log(`User ID: ${testmeUser._id}`);
    console.log(`GitLab Integration:`, testmeUser.gitlabIntegration);
    
    // Check if GitLab integration is connected
    const isGitLabConnected = testmeUser.gitlabIntegration?.connected;
    console.log(`\nGitLab integration connected: ${isGitLabConnected}`);
    
    if (isGitLabConnected) {
      console.log('\n--- Checking Activity Records ---');
      
      // Check activity records
      const activityRecords = await db.collection('activityrecords').find({
        userId: testmeUser._id
      }).toArray();
      
      console.log(`Total activity records: ${activityRecords.length}`);
      
      if (activityRecords.length > 0) {
        console.log('\nActivity records:');
        activityRecords.forEach((record, index) => {
          console.log(`${index + 1}. Type: ${record.type}`);
          console.log(`   Repository: ${record.repositoryName || 'N/A'}`);
          console.log(`   Timestamp: ${record.timestamp || record.createdAt}`);
          console.log(`   User ID: ${record.userId} (${typeof record.userId})`);
          console.log('');
        });
        
        // Filter commit records
        const commitRecords = activityRecords.filter(record => record.type === 'commit');
        console.log(`\nCommit records: ${commitRecords.length}`);
        
        // Get unique repositories
        const uniqueRepos = new Set(commitRecords.map(record => record.repositoryName));
        console.log(`Unique repositories: ${uniqueRepos.size}`);
        console.log(`Repository names: ${Array.from(uniqueRepos).join(', ')}`);
        
        // Filter merge request records
        const mrRecords = activityRecords.filter(record => record.type === 'merge_request');
        console.log(`Merge request records: ${mrRecords.length}`);
      } else {
        console.log('❌ No activity records found!');
      }
    } else {
      console.log('❌ GitLab integration not connected!');
    }
    
    console.log('\n--- Checking Attendance Records ---');
    const attendanceRecords = await db.collection('attendancerecords').find({
      userId: testmeUser._id
    }).toArray();
    
    console.log(`Total attendance records: ${attendanceRecords.length}`);
    
    if (attendanceRecords.length > 0) {
      const presentRecords = attendanceRecords.filter(record => record.status === 'present');
      const attendanceRate = Math.round((presentRecords.length / attendanceRecords.length) * 100);
      console.log(`Present days: ${presentRecords.length}`);
      console.log(`Attendance rate: ${attendanceRate}%`);
    }
    
    console.log('\n--- Simulating Profile Stats API Logic ---');
    
    // Simulate the exact logic from the profile stats API
    const stats = {
      tasksCompleted: 0,
      tasksInProgress: 0,
      totalTasks: 0,
      commitCount: 0,
      currentStreak: 0,
      longestStreak: 0,
      attendanceRate: 0,
      totalAttendance: 0,
      presentDays: 0,
      averageTaskCompletion: 0,
      repositoriesContributed: 0,
      mergeRequestsCreated: 0,
      pointsEarned: 0
    };
    
    // Task statistics
    const userIdString = testmeUser._id.toString();
    const taskQuery = {
      $or: [
        { assignedTo: userIdString },
        { assignedTo: testmeUser._id },
        { 'submissions.internId': testmeUser._id }
      ]
    };
    
    const [completedTasks, inProgressTasks, totalTasks] = await Promise.all([
      db.collection('tasks').countDocuments({ ...taskQuery, status: 'completed' }),
      db.collection('tasks').countDocuments({ ...taskQuery, status: 'in_progress' }),
      db.collection('tasks').countDocuments(taskQuery)
    ]);
    
    stats.tasksCompleted = completedTasks;
    stats.tasksInProgress = inProgressTasks;
    stats.totalTasks = totalTasks;
    stats.averageTaskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // GitLab/Commit statistics
    if (testmeUser.gitlabIntegration?.connected) {
      const commitRecords = await db.collection('activityrecords').find({
        userId: testmeUser._id,
        type: 'commit'
      }).toArray();
      
      stats.commitCount = commitRecords.length;
      
      // Repository statistics
      const uniqueRepos = new Set(commitRecords.map(record => record.repositoryName));
      stats.repositoriesContributed = uniqueRepos.size;
      
      // Merge request statistics
      const mrRecords = await db.collection('activityrecords').find({
        userId: testmeUser._id,
        type: 'merge_request'
      }).toArray();
      stats.mergeRequestsCreated = mrRecords.length;
    }
    
    // Attendance statistics
    const attendanceRecordsForStats = await db.collection('attendancerecords').find({
      userId: testmeUser._id
    }).toArray();
    
    if (attendanceRecordsForStats.length > 0) {
      const presentRecords = attendanceRecordsForStats.filter(record => record.status === 'present');
      stats.totalAttendance = attendanceRecordsForStats.length;
      stats.presentDays = presentRecords.length;
      stats.attendanceRate = Math.round((presentRecords.length / attendanceRecordsForStats.length) * 100);
    }
    
    console.log('\nExpected stats from API:');
    console.log(JSON.stringify(stats, null, 2));
    
    console.log('\n✅ Debug completed');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error debugging profile stats API:', error);
    process.exit(1);
  }
}