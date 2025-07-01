// CommonJS script to test profile stats API functionality
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
  testProfileStats();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function testProfileStats() {
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
    
    console.log(`\nTesting profile stats for user: ${testmeUser.name}`);
    console.log(`User ID: ${testmeUser._id}`);
    
    // Simulate the profile stats API logic
    const userIdString = testmeUser._id.toString();
    const taskQuery = {
      $or: [
        { assignedTo: userIdString }, // String comparison
        { assignedTo: testmeUser._id }, // ObjectId comparison
        { 'submissions.internId': testmeUser._id }
      ]
    };
    
    console.log('\n--- Task Statistics ---');
    console.log('Task query:', JSON.stringify(taskQuery, null, 2));
    
    // Test task queries
    const [completedTasks, inProgressTasks, totalTasks] = await Promise.all([
      db.collection('tasks').countDocuments({ ...taskQuery, status: 'completed' }),
      db.collection('tasks').countDocuments({ ...taskQuery, status: 'in_progress' }),
      db.collection('tasks').countDocuments(taskQuery)
    ]);
    
    console.log(`Completed tasks: ${completedTasks}`);
    console.log(`In progress tasks: ${inProgressTasks}`);
    console.log(`Total tasks: ${totalTasks}`);
    
    // Get actual completed tasks data
    const completedTasksData = await db.collection('tasks').find({
      ...taskQuery,
      status: { $in: ['completed', 'done', 'approved'] }
    }).toArray();
    
    console.log('\nCompleted tasks details:');
    let totalTaskPoints = 0;
    completedTasksData.forEach((task, index) => {
      console.log(`${index + 1}. "${task.title}" - ${task.points || 10} points`);
      totalTaskPoints += (task.points || 10);
    });
    console.log(`Total task points: ${totalTaskPoints}`);
    
    console.log('\n--- Activity Statistics ---');
    // Check activity records
    const activityRecords = await db.collection('activityrecords').find({
      userId: testmeUser._id
    }).toArray();
    
    const commitRecords = activityRecords.filter(record => record.type === 'commit');
    const mrRecords = activityRecords.filter(record => record.type === 'merge_request');
    
    console.log(`Total activity records: ${activityRecords.length}`);
    console.log(`Commit records: ${commitRecords.length}`);
    console.log(`Merge request records: ${mrRecords.length}`);
    
    // Repository count
    const uniqueRepos = new Set(commitRecords.map(record => record.repositoryName));
    console.log(`Unique repositories: ${uniqueRepos.size}`);
    console.log(`Repository names: ${Array.from(uniqueRepos).join(', ')}`);
    
    console.log('\n--- Attendance Statistics ---');
    // Check attendance records
    const attendanceRecords = await db.collection('attendancerecords').find({
      userId: testmeUser._id
    }).toArray();
    
    const presentRecords = attendanceRecords.filter(record => record.status === 'present');
    const attendanceRate = attendanceRecords.length > 0 ? 
      Math.round((presentRecords.length / attendanceRecords.length) * 100) : 0;
    
    console.log(`Total attendance records: ${attendanceRecords.length}`);
    console.log(`Present days: ${presentRecords.length}`);
    console.log(`Attendance rate: ${attendanceRate}%`);
    
    console.log('\n--- GitLab Integration ---');
    console.log(`GitLab integration connected: ${testmeUser.gitlabIntegration?.connected || false}`);
    
    console.log('\n--- Expected Profile Stats ---');
    const expectedStats = {
      tasksCompleted: completedTasks,
      tasksInProgress: inProgressTasks,
      totalTasks: totalTasks,
      averageTaskCompletion: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      commitCount: commitRecords.length,
      repositoriesContributed: uniqueRepos.size,
      mergeRequestsCreated: mrRecords.length,
      attendanceRate: attendanceRate,
      taskPoints: totalTaskPoints,
      bonusPoints: calculateBonusPoints(commitRecords.length, attendanceRate, mrRecords.length),
      pointsEarned: totalTaskPoints + calculateBonusPoints(commitRecords.length, attendanceRate, mrRecords.length)
    };
    
    console.log(JSON.stringify(expectedStats, null, 2));
    
    console.log('\n✅ Profile stats test completed successfully');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error testing profile stats:', error);
    process.exit(1);
  }
}

function calculateBonusPoints(commitCount, attendanceRate, mergeRequestsCreated) {
  let bonusPoints = 0;
  
  // Bonus points for commits
  bonusPoints += Math.min(commitCount * 2, 100);
  
  // Bonus points for attendance
  if (attendanceRate >= 90) bonusPoints += 50;
  else if (attendanceRate >= 80) bonusPoints += 30;
  else if (attendanceRate >= 70) bonusPoints += 15;
  
  // Bonus points for merge requests
  bonusPoints += mergeRequestsCreated * 15;
  
  return bonusPoints;
}