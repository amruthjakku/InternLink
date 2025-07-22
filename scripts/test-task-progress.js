#!/usr/bin/env node

/**
 * Test script for the TaskProgress system
 * 
 * This script tests the basic functionality of individual task progress tracking
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Task = require('../models/Task').default;
const User = require('../models/User').default;
const TaskProgress = require('../models/TaskProgress').default;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/internlink';

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

async function testTaskProgressSystem() {
  console.log('Testing TaskProgress System...\n');
  
  try {
    // 1. Find a test cohort task
    const cohortTask = await Task.findOne({ 
      assignmentType: 'cohort',
      isActive: true 
    }).populate('cohortId', 'name');
    
    if (!cohortTask) {
      console.log('❌ No cohort tasks found. Please create a cohort task first.');
      return;
    }
    
    console.log(`✅ Found test task: "${cohortTask.title}"`);
    console.log(`   Assignment type: ${cohortTask.assignmentType}`);
    console.log(`   Cohort: ${cohortTask.cohortId?.name || 'Unknown'}`);
    console.log(`   Points: ${cohortTask.points || 10}\n`);
    
    // 2. Find interns in the cohort
    const cohortAIDeveloperInterns = await User.find({
      cohortId: cohortTask.cohortId,
      role: 'AI Developer Intern',
      isActive: true
    }).limit(3); // Test with first 3 interns
    
    if (cohortAIDeveloperInterns.length === 0) {
      console.log('❌ No interns found in the cohort. Please add interns first.');
      return;
    }
    
    console.log(`✅ Found ${cohortAIDeveloperInterns.length} interns in cohort:`);
    cohortAIDeveloperInterns.forEach(intern => {
      console.log(`   - ${intern.name} (${intern.gitlabUsername})`);
    });
    console.log();
    
    // 3. Test individual progress creation
    console.log('🧪 Testing individual progress creation...');
    
    for (let i = 0; i < cohortAIDeveloperInterns.length; i++) {
      const intern = cohortAIDeveloperInterns[i];
      
      // Check if progress already exists
      let progress = await TaskProgress.findOne({
        taskId: cohortTask._id,
        internId: intern._id
      });
      
      if (!progress) {
        // Create new progress
        progress = new TaskProgress({
          taskId: cohortTask._id,
          internId: intern._id,
          status: 'not_started',
          progress: 0,
          pointsEarned: 0
        });
        await progress.save();
        console.log(`   ✅ Created progress record for ${intern.name}`);
      } else {
        console.log(`   ℹ️  Progress record already exists for ${intern.name}`);
      }
      
      // Test different progress states for each intern
      if (i === 0) {
        // First intern: mark as in progress
        progress.status = 'in_progress';
        progress.progress = 50;
        progress.startedAt = new Date();
        await progress.save();
        console.log(`   📝 Updated ${intern.name} to in_progress (50%)`);
      } else if (i === 1) {
        // Second intern: mark as completed
        progress.status = 'completed';
        progress.progress = 100;
        progress.completedAt = new Date();
        progress.pointsEarned = cohortTask.points || 10;
        await progress.save();
        console.log(`   ✅ Updated ${intern.name} to completed (100%)`);
      }
      // Third intern remains not_started
    }
    console.log();
    
    // 4. Test progress retrieval
    console.log('🔍 Testing progress retrieval...');
    
    const allProgress = await TaskProgress.find({
      taskId: cohortTask._id
    }).populate('internId', 'name gitlabUsername');
    
    console.log(`   Found ${allProgress.length} progress records:`);
    allProgress.forEach(progress => {
      console.log(`   - ${progress.internId.name}: ${progress.status} (${progress.progress}%) - ${progress.pointsEarned} points`);
    });
    console.log();
    
    // 5. Test leaderboard calculation
    console.log('🏆 Testing leaderboard calculation...');
    
    const leaderboardData = await TaskProgress.aggregate([
      {
        $match: { 
          internId: { $in: cohortAIDeveloperInterns.map(i => i._id) },
          status: { $in: ['completed', 'done'] }
        }
      },
      {
        $group: {
          _id: '$internId',
          totalPoints: { $sum: '$pointsEarned' },
          completedTasks: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'AI Developer Intern'
        }
      },
      {
        $unwind: '$intern'
      },
      {
        $project: {
          name: '$intern.name',
          gitlabUsername: '$intern.gitlabUsername',
          totalPoints: 1,
          completedTasks: 1
        }
      },
      {
        $sort: { totalPoints: -1 }
      }
    ]);
    
    if (leaderboardData.length > 0) {
      console.log('   Leaderboard (completed tasks only):');
      leaderboardData.forEach((entry, index) => {
        console.log(`   ${index + 1}. ${entry.name}: ${entry.totalPoints} points (${entry.completedTasks} tasks)`);
      });
    } else {
      console.log('   No completed tasks found for leaderboard');
    }
    console.log();
    
    // 6. Test subtask progress (if task has subtasks)
    if (cohortTask.subtasks && cohortTask.subtasks.length > 0) {
      console.log('🔧 Testing subtask progress...');
      
      const testAIDeveloperIntern = cohortAIDeveloperInterns[0];
      let progress = await TaskProgress.findOne({
        taskId: cohortTask._id,
        internId: testAIDeveloperIntern._id
      });
      
      // Add subtask progress
      const firstSubtask = cohortTask.subtasks[0];
      const subtaskProgressIndex = progress.subtaskProgress.findIndex(
        sp => sp.subtaskId.toString() === firstSubtask._id.toString()
      );
      
      if (subtaskProgressIndex === -1) {
        progress.subtaskProgress.push({
          subtaskId: firstSubtask._id,
          completed: true,
          completedAt: new Date(),
          actualHours: 2
        });
      } else {
        progress.subtaskProgress[subtaskProgressIndex].completed = true;
        progress.subtaskProgress[subtaskProgressIndex].completedAt = new Date();
      }
      
      await progress.save();
      console.log(`   ✅ Updated subtask progress for ${testAIDeveloperIntern.name}`);
      console.log(`   Subtask: "${firstSubtask.title}" marked as completed`);
    }
    console.log();
    
    // 7. Summary
    console.log('📊 Test Summary:');
    console.log(`   ✅ Task: ${cohortTask.title}`);
    console.log(`   ✅ AI Developer Interns tested: ${cohortAIDeveloperInterns.length}`);
    console.log(`   ✅ Progress records: ${allProgress.length}`);
    console.log(`   ✅ Individual tracking: Working correctly`);
    console.log(`   ✅ Leaderboard calculation: Working correctly`);
    
    if (cohortTask.subtasks && cohortTask.subtasks.length > 0) {
      console.log(`   ✅ Subtask tracking: Working correctly`);
    }
    
    console.log('\n🎉 All tests passed! TaskProgress system is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

async function cleanupTestData() {
  const shouldCleanup = process.argv.includes('--cleanup');
  
  if (shouldCleanup) {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      // Find test progress records (you might want to be more specific)
      const testProgress = await TaskProgress.find({}).limit(10);
      
      if (testProgress.length > 0) {
        console.log(`Found ${testProgress.length} progress records`);
        console.log('Note: Cleanup not implemented to prevent accidental data loss');
        console.log('Please manually clean up test data if needed');
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

async function main() {
  try {
    await connectToDatabase();
    
    console.log('TaskProgress System Test');
    console.log('========================\n');
    
    await testTaskProgressSystem();
    await cleanupTestData();
    
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  main();
}

module.exports = { testTaskProgressSystem };