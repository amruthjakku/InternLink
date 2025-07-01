// CommonJS script to test profile stats API directly
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Import the generateUserStats function logic
const { connectToDatabase, getDatabase } = require('../utils/database');

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
  testProfileAPIDirectly();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function testProfileAPIDirectly() {
  try {
    await connectToDatabase();
    const db = await getDatabase();
    
    // Find the testme user
    const testmeUser = await db.collection('users').findOne({ 
      name: 'test me'
    });
    
    if (!testmeUser) {
      console.log('testme user not found');
      return;
    }
    
    console.log(`\nTesting profile stats API logic for user: ${testmeUser.name}`);
    console.log(`User ID: ${testmeUser._id} (${typeof testmeUser._id})`);
    
    // Call the exact generateUserStats function logic
    const stats = await generateUserStats(testmeUser, db);
    
    console.log('\nGenerated stats:');
    console.log(JSON.stringify(stats, null, 2));
    
    console.log('\n✅ Direct API test completed');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error testing profile API directly:', error);
    process.exit(1);
  }
}

async function generateUserStats(user, db) {
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
    codeReviewsGiven: 0,
    pointsEarned: 0
  };

  try {
    // Task statistics - use raw MongoDB queries to handle string assignedTo values
    const userIdString = user._id.toString();
    const taskQuery = {
      $or: [
        { assignedTo: userIdString }, // String comparison
        { assignedTo: user._id }, // ObjectId comparison
        { 'submissions.internId': user._id }
      ]
    };

    // Use raw MongoDB queries instead of Mongoose to avoid type conversion issues
    const [completedTasks, inProgressTasks, totalTasks] = await Promise.all([
      db.collection('tasks').countDocuments({ ...taskQuery, status: 'completed' }),
      db.collection('tasks').countDocuments({ ...taskQuery, status: 'in_progress' }),
      db.collection('tasks').countDocuments(taskQuery)
    ]);

    stats.tasksCompleted = completedTasks;
    stats.tasksInProgress = inProgressTasks;
    stats.totalTasks = totalTasks;
    stats.averageTaskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate actual points from completed tasks
    const completedTasksData = await db.collection('tasks').find({
      ...taskQuery,
      status: { $in: ['completed', 'done', 'approved'] }
    }).toArray();
    
    const actualPointsFromTasks = completedTasksData.reduce((total, task) => {
      return total + (task.points || 10);
    }, 0);
    
    console.log(`User ${user.name} has ${completedTasksData.length} completed tasks worth ${actualPointsFromTasks} points`);

    // GitLab/Commit statistics
    console.log(`Checking GitLab integration: ${user.gitlabIntegration?.connected}`);
    if (user.gitlabIntegration?.connected) {
      console.log(`Querying activity records for userId: ${user._id} (${typeof user._id})`);
      
      const commitRecords = await db.collection('activityrecords').find({
        userId: user._id,
        type: 'commit'
      }).toArray();

      console.log(`Found ${commitRecords.length} commit records`);
      stats.commitCount = commitRecords.length;

      // Calculate commit streak
      const streakData = calculateCommitStreak(commitRecords);
      stats.currentStreak = streakData.current;
      stats.longestStreak = streakData.longest;

      // Repository statistics
      const uniqueRepos = new Set(commitRecords.map(record => record.repositoryName));
      stats.repositoriesContributed = uniqueRepos.size;
      console.log(`Found ${uniqueRepos.size} unique repositories: ${Array.from(uniqueRepos).join(', ')}`);

      // Merge request statistics (if available)
      const mrRecords = await db.collection('activityrecords').find({
        userId: user._id,
        type: 'merge_request'
      }).toArray();
      stats.mergeRequestsCreated = mrRecords.length;
      console.log(`Found ${mrRecords.length} merge request records`);
    } else {
      console.log('GitLab integration not connected');
    }

    // Attendance statistics
    const attendanceRecords = await db.collection('attendancerecords').find({
      userId: user._id
    }).toArray();

    if (attendanceRecords.length > 0) {
      const presentRecords = attendanceRecords.filter(record => record.status === 'present');
      stats.totalAttendance = attendanceRecords.length;
      stats.presentDays = presentRecords.length;
      stats.attendanceRate = Math.round((presentRecords.length / attendanceRecords.length) * 100);
    }

    // Points calculation (based on actual task points + activity bonuses)
    const activityBonusPoints = calculateActivityBonusPoints({
      commitCount: stats.commitCount,
      attendanceRate: stats.attendanceRate,
      mergeRequestsCreated: stats.mergeRequestsCreated
    });
    
    stats.pointsEarned = actualPointsFromTasks + activityBonusPoints;
    stats.taskPoints = actualPointsFromTasks;
    stats.bonusPoints = activityBonusPoints;

    return stats;

  } catch (error) {
    console.error('Error generating user stats:', error);
    return stats; // Return default stats on error
  }
}

function calculateCommitStreak(commitRecords) {
  if (commitRecords.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Sort commits by date
  const sortedCommits = commitRecords
    .map(record => new Date(record.timestamp || record.createdAt))
    .sort((a, b) => b - a);

  // Group commits by day
  const commitDays = new Set();
  sortedCommits.forEach(date => {
    const dayKey = date.toISOString().split('T')[0];
    commitDays.add(dayKey);
  });

  const uniqueDays = Array.from(commitDays).sort().reverse();
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate current streak
  for (let i = 0; i < uniqueDays.length; i++) {
    const commitDate = new Date(uniqueDays[i]);
    const daysDiff = Math.floor((today - commitDate) / (1000 * 60 * 60 * 24));
    
    if (i === 0 && daysDiff <= 1) {
      // Started streak (today or yesterday)
      currentStreak = 1;
      tempStreak = 1;
    } else if (i > 0) {
      const prevDate = new Date(uniqueDays[i - 1]);
      const daysBetween = Math.floor((prevDate - commitDate) / (1000 * 60 * 60 * 24));
      
      if (daysBetween === 1) {
        // Consecutive day
        if (currentStreak > 0) currentStreak++;
        tempStreak++;
      } else {
        // Streak broken
        longestStreak = Math.max(longestStreak, tempStreak);
        if (currentStreak > 0) currentStreak = 0;
        tempStreak = 1;
      }
    }
  }
  
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
  
  return { current: currentStreak, longest: longestStreak };
}

function calculateActivityBonusPoints(activities) {
  let bonusPoints = 0;
  
  // Bonus points for commits (not the main task points)
  bonusPoints += Math.min(activities.commitCount * 2, 100); // Max 100 bonus points from commits
  
  // Bonus points for attendance
  if (activities.attendanceRate >= 90) bonusPoints += 50;
  else if (activities.attendanceRate >= 80) bonusPoints += 30;
  else if (activities.attendanceRate >= 70) bonusPoints += 15;
  
  // Bonus points for merge requests
  bonusPoints += activities.mergeRequestsCreated * 15;
  
  return bonusPoints;
}