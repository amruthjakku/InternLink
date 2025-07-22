#!/usr/bin/env node

/**
 * Migration script to transition from task-based progress tracking to individual TaskProgress records
 * 
 * This script will:
 * 1. Find all tasks that have been assigned to cohorts or individuals
 * 2. Create TaskProgress records for each intern based on existing task data
 * 3. Preserve existing completion status and progress data
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

async function migrateTaskProgress() {
  console.log('Starting TaskProgress migration...');
  
  try {
    // Get all active tasks
    const tasks = await Task.find({ isActive: true });
    console.log(`Found ${tasks.length} active tasks to process`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const task of tasks) {
      console.log(`\nProcessing task: ${task.title} (${task._id})`);
      console.log(`Assignment type: ${task.assignmentType}`);
      
      try {
        let interns = [];
        
        if (task.assignmentType === 'individual' && task.assignedTo) {
          // Individual task - find the assigned intern
          const intern = await User.findById(task.assignedTo);
          if (intern && intern.role === 'AI developer Intern') {
            interns = [intern];
            console.log(`  Found assigned intern: ${intern.name} (${intern.gitlabUsername})`);
          } else {
            console.log(`  Assigned user not found or not an intern: ${task.assignedTo}`);
          }
        } else if (task.assignmentType === 'cohort' && task.cohortId) {
          // Cohort task - find all interns in the cohort
          const cohortInterns = await User.find({ 
            cohortId: task.cohortId, 
            role: 'AI developer Intern',
            isActive: true 
          });
          interns = cohortInterns;
          console.log(`  Found ${interns.length} interns in cohort ${task.cohortId}`);
        } else if (task.assignmentType === 'hierarchical' && task.assignedTo?.colleges) {
          // Hierarchical task - find interns in specified colleges
          const collegeInterns = await User.find({
            college: { $in: task.assignedTo.colleges },
            role: 'AI developer Intern',
            isActive: true
          });
          interns = collegeInterns;
          console.log(`  Found ${interns.length} interns in specified colleges`);
        } else {
          console.log(`  Skipping task - no valid assignment found`);
          skippedCount++;
          continue;
        }
        
        // Create TaskProgress records for each intern
        for (const intern of interns) {
          try {
            // Check if TaskProgress already exists
            const existingProgress = await TaskProgress.findOne({
              taskId: task._id,
              internId: intern._id
            });
            
            if (existingProgress) {
              console.log(`    TaskProgress already exists for ${intern.gitlabUsername}`);
              continue;
            }
            
            // Determine initial status and progress based on task data
            let status = 'not_started';
            let progress = 0;
            let pointsEarned = 0;
            let completedAt = null;
            
            // Check if this task was completed by looking at task status and completion records
            if (task.status === 'completed' || task.status === 'done') {
              // For now, assume all interns completed the task if the task is marked as completed
              // In a real migration, you might have more specific completion data
              status = 'completed';
              progress = 100;
              pointsEarned = task.points || 10;
              completedAt = task.completedAt || task.updatedAt;
            } else if (task.status === 'in_progress') {
              status = 'in_progress';
              progress = task.progress || 50;
            } else if (task.status === 'review') {
              status = 'review';
              progress = task.progress || 90;
            }
            
            // Check if there are completion records for this intern
            if (task.completions && task.completions.length > 0) {
              const internCompletion = task.completions.find(
                c => c.internId?.toString() === intern._id.toString() ||
                     c.gitlabUsername === intern.gitlabUsername
              );
              
              if (internCompletion) {
                status = 'completed';
                progress = 100;
                pointsEarned = task.points || 10;
                completedAt = internCompletion.completedAt;
                console.log(`    Found completion record for ${intern.gitlabUsername}`);
              }
            }
            
            // Create TaskProgress record
            const taskProgress = new TaskProgress({
              taskId: task._id,
              internId: intern._id,
              status: status,
              progress: progress,
              pointsEarned: pointsEarned,
              completedAt: completedAt,
              actualHours: 0, // Will be updated as interns log time
              startedAt: status !== 'not_started' ? (task.startDate || task.createdAt) : null
            });
            
            await taskProgress.save();
            console.log(`    Created TaskProgress for ${intern.gitlabUsername}: ${status} (${progress}%)`);
            migratedCount++;
            
          } catch (internError) {
            console.error(`    Error creating TaskProgress for ${intern.gitlabUsername}:`, internError.message);
            errorCount++;
          }
        }
        
      } catch (taskError) {
        console.error(`  Error processing task ${task.title}:`, taskError.message);
        errorCount++;
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`Total tasks processed: ${tasks.length}`);
    console.log(`TaskProgress records created: ${migratedCount}`);
    console.log(`Tasks skipped: ${skippedCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    
    // Verify migration
    const totalProgressRecords = await TaskProgress.countDocuments();
    console.log(`Total TaskProgress records in database: ${totalProgressRecords}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function verifyMigration() {
  console.log('\n=== Verification ===');
  
  try {
    // Get some statistics
    const totalInterns = await User.countDocuments({ role: 'AI developer Intern', isActive: true });
    const totalTasks = await Task.countDocuments({ isActive: true });
    const totalProgress = await TaskProgress.countDocuments();
    
    console.log(`Active interns: ${totalInterns}`);
    console.log(`Active tasks: ${totalTasks}`);
    console.log(`TaskProgress records: ${totalProgress}`);
    
    // Sample some data
    const sampleProgress = await TaskProgress.find()
      .populate('taskId', 'title assignmentType')
      .populate('internId', 'name gitlabUsername')
      .limit(5);
    
    console.log('\nSample TaskProgress records:');
    sampleProgress.forEach(progress => {
      console.log(`  ${progress.internId?.name || 'Unknown'} - ${progress.taskId?.title || 'Unknown Task'}: ${progress.status} (${progress.progress}%)`);
    });
    
  } catch (error) {
    console.error('Verification failed:', error);
  }
}

async function main() {
  try {
    await connectToDatabase();
    
    console.log('TaskProgress Migration Tool');
    console.log('===========================');
    
    // Check if we should run the migration
    const existingProgress = await TaskProgress.countDocuments();
    if (existingProgress > 0) {
      console.log(`Warning: Found ${existingProgress} existing TaskProgress records.`);
      console.log('This migration may create duplicates. Consider running with --force to proceed anyway.');
      
      if (!process.argv.includes('--force')) {
        console.log('Migration aborted. Use --force to proceed anyway.');
        process.exit(0);
      }
    }
    
    await migrateTaskProgress();
    await verifyMigration();
    
    console.log('\nMigration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  main();
}

module.exports = { migrateTaskProgress, verifyMigration };