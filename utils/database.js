import mongoose from 'mongoose';
import { connectToDatabase as connectMongoose } from '../lib/mongoose.js';

// Unified database connection using Mongoose
export async function connectToDatabase() {
  return connectMongoose();
}

// Helper function to get Mongoose connection for direct database operations
// This replaces the legacy getDatabase() function
export async function getDatabase() {
  await connectToDatabase();
  return mongoose.connection.db;
}

// User operations using Mongoose models
export async function createUser(userData) {
  try {
    await connectToDatabase();
    const User = (await import('../models/User.js')).default;
    
    const user = new User({
      ...userData,
      onboardingComplete: false
    });
    
    const savedUser = await user.save();
    return savedUser._id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getUserByGitLabId(gitlabId) {
  try {
    await connectToDatabase();
    const User = (await import('../models/User.js')).default;
    
    return await User.findOne({ gitlabId: String(gitlabId) });
  } catch (error) {
    console.error('Error fetching user by GitLab ID:', error);
    throw error;
  }
}

export async function updateUser(userId, updateData) {
  try {
    await connectToDatabase();
    const User = (await import('../models/User.js')).default;
    
    const result = await User.updateOne(
      { _id: userId },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// College operations using Mongoose models
export async function createCollege(collegeData) {
  try {
    await connectToDatabase();
    const College = (await import('../models/College.js')).default;
    
    const college = new College(collegeData);
    const savedCollege = await college.save();
    return savedCollege._id;
  } catch (error) {
    console.error('Error creating college:', error);
    throw error;
  }
}

export async function getAllColleges() {
  try {
    await connectToDatabase();
    const College = (await import('../models/College.js')).default;
    
    return await College.find({}).lean();
  } catch (error) {
    console.error('Error fetching colleges:', error);
    throw error;
  }
}

export async function getCollegeById(collegeId) {
  try {
    await connectToDatabase();
    const College = (await import('../models/College.js')).default;
    
    return await College.findById(collegeId).lean();
  } catch (error) {
    console.error('Error fetching college:', error);
    throw error;
  }
}

export async function getCollegesByTechLead(mentorId) {
  try {
    await connectToDatabase();
    const College = (await import('../models/College.js')).default;
    
    return await College.find({ 
      createdBy: mentorId
    }).lean();
  } catch (error) {
    console.error('Error fetching colleges by mentor:', error);
    throw error;
  }
}

// Cohort operations using Mongoose models
export async function createCohort(cohortData) {
  try {
    await connectToDatabase();
    const Cohort = (await import('../models/Cohort.js')).default;
    
    const cohort = new Cohort({
      ...cohortData,
      currentAIDeveloperInterns: 0
    });
    
    const savedCohort = await cohort.save();
    return savedCohort._id;
  } catch (error) {
    console.error('Error creating cohort:', error);
    throw error;
  }
}

export async function getCohortsByCollege(collegeId) {
  try {
    await connectToDatabase();
    const Cohort = (await import('../models/Cohort.js')).default;
    
    return await Cohort.find({ 
      collegeId: collegeId
    }).lean();
  } catch (error) {
    console.error('Error fetching cohorts:', error);
    throw error;
  }
}

export async function getCohortById(cohortId) {
  try {
    await connectToDatabase();
    const Cohort = (await import('../models/Cohort.js')).default;
    
    return await Cohort.findById(cohortId).lean();
  } catch (error) {
    console.error('Error fetching cohort:', error);
    throw error;
  }
}

export async function updateCohort(cohortId, updateData) {
  try {
    await connectToDatabase();
    const Cohort = (await import('../models/Cohort.js')).default;
    
    const result = await Cohort.updateOne(
      { _id: cohortId },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating cohort:', error);
    throw error;
  }
}

// Join request operations using Mongoose models
export async function createJoinRequest(requestData) {
  try {
    await connectToDatabase();
    const JoinRequest = (await import('../models/JoinRequest.js')).default;
    
    const joinRequest = new JoinRequest({
      ...requestData,
      status: 'pending'
    });
    
    const savedRequest = await joinRequest.save();
    return savedRequest._id;
  } catch (error) {
    console.error('Error creating join request:', error);
    throw error;
  }
}

export async function getJoinRequestsByTechLead(mentorId) {
  try {
    await connectToDatabase();
    const JoinRequest = (await import('../models/JoinRequest.js')).default;
    
    return await JoinRequest.find({ mentorId }).lean();
  } catch (error) {
    console.error('Error fetching join requests:', error);
    throw error;
  }
}

export async function getJoinRequestsByAIDeveloperIntern(internId) {
  try {
    await connectToDatabase();
    const JoinRequest = (await import('../models/JoinRequest.js')).default;
    
    return await JoinRequest.find({ internId }).lean();
  } catch (error) {
    console.error('Error fetching join requests for intern:', error);
    throw error;
  }
}

export async function updateJoinRequest(requestId, updateData) {
  try {
    await connectToDatabase();
    const JoinRequest = (await import('../models/JoinRequest.js')).default;
    
    const result = await JoinRequest.updateOne(
      { _id: requestId },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date(),
          reviewedAt: new Date()
        } 
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating join request:', error);
    throw error;
  }
}

// Categories functions using Mongoose models
export async function getAllCategories() {
  try {
    await connectToDatabase();
    const Category = (await import('../models/Category.js')).default;
    
    return await Category.find({}).lean();
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

export async function createCategory(categoryData) {
  try {
    await connectToDatabase();
    const Category = (await import('../models/Category.js')).default;
    
    const category = new Category(categoryData);
    const savedCategory = await category.save();
    return savedCategory._id;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

// Tasks functions using Mongoose models
export async function updateTaskStatus(taskId, status, userId) {
  try {
    await connectToDatabase();
    const Task = (await import('../models/Task.js')).default;
    
    const updateData = { 
      status,
      updatedAt: new Date()
    };
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
      updateData.completedBy = userId;
    }
    
    const result = await Task.updateOne(
      { _id: taskId },
      { $set: updateData }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}

// Attendance operations using Mongoose models
export async function createAttendanceRecord(attendanceData) {
  try {
    await connectToDatabase();
    const Attendance = (await import('../models/Attendance.js')).default;
    
    const attendance = new Attendance(attendanceData);
    const savedAttendance = await attendance.save();
    return savedAttendance._id;
  } catch (error) {
    console.error('Error creating attendance record:', error);
    throw error;
  }
}

export async function getAttendanceByUser(userId, startDate, endDate) {
  try {
    await connectToDatabase();
    const Attendance = (await import('../models/Attendance.js')).default;
    
    const query = { userId: userId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    return await Attendance.find(query).sort({ date: -1 }).lean();
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
}

export async function updateAttendanceRecord(recordId, updateData) {
  try {
    await connectToDatabase();
    const Attendance = (await import('../models/Attendance.js')).default;
    
    const result = await Attendance.updateOne(
      { _id: recordId },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating attendance record:', error);
    throw error;
  }
}

// Task operations using Mongoose models
export async function createTask(taskData) {
  try {
    await connectToDatabase();
    const Task = (await import('../models/Task.js')).default;
    
    const task = new Task({
      ...taskData,
      status: 'pending'
    });
    
    const savedTask = await task.save();
    return savedTask._id;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

export async function getTasksByUser(userId) {
  try {
    await connectToDatabase();
    const Task = (await import('../models/Task.js')).default;
    
    return await Task.find({ 
      assignedTo: { $in: [userId] }
    }).sort({ createdAt: -1 }).lean();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

export async function updateTask(taskId, updateData) {
  try {
    await connectToDatabase();
    const Task = (await import('../models/Task.js')).default;
    
    const result = await Task.updateOne(
      { _id: taskId },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}