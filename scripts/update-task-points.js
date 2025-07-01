// Script to update all tasks to have default points
import mongoose from 'mongoose';
import { connectToDatabase } from '../lib/mongoose';

// Define Task model schema
const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: String,
  points: {
    type: Number,
    default: 10
  },
  progress: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

async function updateTaskPoints() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Connected to database');

    // Get the Task model
    const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

    // Find all tasks without points or with points set to 0
    const tasksToUpdate = await Task.find({
      $or: [
        { points: { $exists: false } },
        { points: null },
        { points: 0 }
      ]
    });

    console.log(`Found ${tasksToUpdate.length} tasks to update`);

    // Update tasks with default points
    for (const task of tasksToUpdate) {
      // Set default points based on status
      let defaultPoints = 10;
      
      // Completed tasks get more points
      if (task.status === 'completed' || task.status === 'done') {
        defaultPoints = 20;
      }
      
      // Update the task
      task.points = defaultPoints;
      
      // Update progress based on status if not set
      if (task.progress === undefined || task.progress === null) {
        if (task.status === 'completed' || task.status === 'done') {
          task.progress = 100;
        } else if (task.status === 'in_progress') {
          task.progress = 50;
        } else if (task.status === 'review') {
          task.progress = 90;
        } else {
          task.progress = 0;
        }
      }
      
      await task.save();
      console.log(`Updated task: ${task.title} - Points: ${task.points}, Progress: ${task.progress}`);
    }

    console.log('Task points update completed successfully');
  } catch (error) {
    console.error('Error updating task points:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the update function
updateTaskPoints().catch(console.error);

// Export for ES modules
export {};