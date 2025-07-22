import { MongoClient, ObjectId } from 'mongodb';
import { connectToDatabase as connectMongoose } from '../lib/mongoose.js';

// Legacy MongoClient for direct MongoDB operations
// This is kept for backward compatibility with existing code
let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('MongoDB URI is required. Please set MONGODB_URI in your environment variables.');
}

// Configure MongoDB client with better error handling and TLS options
const mongoOptions = {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 10000,
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: process.env.NODE_ENV !== 'production',
  retryWrites: true,
  retryReads: true,
  maxPoolSize: 10, // Reduced pool size for M0 cluster
  maxIdleTimeMS: 60000, // Close idle connections after 1 minute
};

// Global is used here to maintain a cached connection across hot reloads
let cached = global.mongodb;
if (!cached) {
  cached = global.mongodb = { conn: null, promise: null };
}

// Initialize MongoDB client connection
if (!cached.promise) {
  client = new MongoClient(process.env.MONGODB_URI, mongoOptions);
  cached.promise = client.connect()
    .then((client) => {
      console.log('MongoDB client connected successfully');
      return client;
    })
    .catch(err => {
      console.error('MongoDB client connection error:', err);
      cached.promise = null;
      throw err;
    });
}

// Get MongoDB client promise
clientPromise = async () => {
  if (cached.conn) {
    return cached.conn;
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
};

// Database helper functions
export async function getDatabase() {
  const client = await clientPromise();
  return client.db('internship_tracker');
}

// Mongoose connection helper - now uses the centralized connection manager
export async function connectToDatabase() {
  return connectMongoose();
}

// User operations
export async function createUser(userData) {
  try {
    const db = await getDatabase();
    const result = await db.collection('users').insertOne({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      onboardingComplete: false
    });
    return result.insertedId;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getUserByGitLabId(gitlabId) {
  try {
    const db = await getDatabase();
    return await db.collection('users').findOne({ gitlabId: String(gitlabId) });
  } catch (error) {
    console.error('Error fetching user by GitLab ID:', error);
    throw error;
  }
}

export async function updateUser(userId, updateData) {
  try {
    const db = await getDatabase();
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
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

// College operations
export async function createCollege(collegeData) {
  try {
    const db = await getDatabase();
    const result = await db.collection('colleges').insertOne({
      ...collegeData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return result.insertedId;
  } catch (error) {
    console.error('Error creating college:', error);
    throw error;
  }
}

export async function getAllColleges() {
  try {
    const db = await getDatabase();
    return await db.collection('colleges').find({}).toArray();
  } catch (error) {
    console.error('Error fetching colleges:', error);
    throw error;
  }
}

export async function getCollegeById(collegeId) {
  try {
    const db = await getDatabase();
    return await db.collection('colleges').findOne({ _id: new ObjectId(collegeId) });
  } catch (error) {
    console.error('Error fetching college:', error);
    throw error;
  }
}

export async function getCollegesByTechLead(mentorId) {
  try {
    const db = await getDatabase();
    return await db.collection('colleges').find({ 
      createdBy: mentorId
    }).toArray();
  } catch (error) {
    console.error('Error fetching colleges by mentor:', error);
    throw error;
  }
}

// Cohort operations
export async function createCohort(cohortData) {
  try {
    const db = await getDatabase();
    const result = await db.collection('cohorts').insertOne({
      ...cohortData,
      currentAIDeveloperInterns: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return result.insertedId;
  } catch (error) {
    console.error('Error creating cohort:', error);
    throw error;
  }
}

export async function getCohortsByCollege(collegeId) {
  try {
    const db = await getDatabase();
    return await db.collection('cohorts').find({ 
      collegeId: new ObjectId(collegeId)
    }).toArray();
  } catch (error) {
    console.error('Error fetching cohorts:', error);
    throw error;
  }
}

export async function getCohortById(cohortId) {
  try {
    const db = await getDatabase();
    return await db.collection('cohorts').findOne({ _id: new ObjectId(cohortId) });
  } catch (error) {
    console.error('Error fetching cohort:', error);
    throw error;
  }
}

export async function updateCohort(cohortId, updateData) {
  try {
    const db = await getDatabase();
    const result = await db.collection('cohorts').updateOne(
      { _id: new ObjectId(cohortId) },
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

// Join request operations
export async function createJoinRequest(requestData) {
  try {
    const db = await getDatabase();
    const result = await db.collection('joinRequests').insertOne({
      ...requestData,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return result.insertedId;
  } catch (error) {
    console.error('Error creating join request:', error);
    throw error;
  }
}

export async function getJoinRequestsByTechLead(mentorId) {
  try {
    const db = await getDatabase();
    return await db.collection('joinRequests').find({ mentorId }).toArray();
  } catch (error) {
    console.error('Error fetching join requests:', error);
    throw error;
  }
}

export async function getJoinRequestsByAIDeveloperIntern(internId) {
  try {
    const db = await getDatabase();
    return await db.collection('joinRequests').find({ internId }).toArray();
  } catch (error) {
    console.error('Error fetching join requests for intern:', error);
    throw error;
  }
}

export async function updateJoinRequest(requestId, updateData) {
  try {
    const db = await getDatabase();
    const result = await db.collection('joinRequests').updateOne(
      { _id: new ObjectId(requestId) },
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

// Categories functions
export async function getAllCategories() {
  try {
    const db = await getDatabase();
    return await db.collection('categories').find({}).toArray();
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

export async function createCategory(categoryData) {
  try {
    const db = await getDatabase();
    const result = await db.collection('categories').insertOne({
      ...categoryData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return result.insertedId;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

// Tasks functions
export async function updateTaskStatus(taskId, status, userId) {
  try {
    const db = await getDatabase();
    const result = await db.collection('tasks').updateOne(
      { _id: new ObjectId(taskId) },
      { 
        $set: { 
          status,
          updatedAt: new Date(),
          ...(status === 'completed' && { completedAt: new Date(), completedBy: userId })
        } 
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}

// Attendance operations
export async function createAttendanceRecord(attendanceData) {
  try {
    const db = await getDatabase();
    const result = await db.collection('attendance').insertOne({
      ...attendanceData,
      createdAt: new Date()
    });
    return result.insertedId;
  } catch (error) {
    console.error('Error creating attendance record:', error);
    throw error;
  }
}

export async function getAttendanceByUser(userId, startDate, endDate) {
  try {
    const db = await getDatabase();
    const query = { userId: new ObjectId(userId) };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    return await db.collection('attendance').find(query).sort({ date: -1 }).toArray();
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
}

export async function updateAttendanceRecord(recordId, updateData) {
  try {
    const db = await getDatabase();
    const result = await db.collection('attendance').updateOne(
      { _id: new ObjectId(recordId) },
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

// Task operations
export async function createTask(taskData) {
  try {
    const db = await getDatabase();
    const result = await db.collection('tasks').insertOne({
      ...taskData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending'
    });
    return result.insertedId;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

export async function getTasksByUser(userId) {
  try {
    const db = await getDatabase();
    return await db.collection('tasks').find({ 
      assignedTo: { $in: [new ObjectId(userId)] }
    }).sort({ createdAt: -1 }).toArray();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

export async function updateTask(taskId, updateData) {
  try {
    const db = await getDatabase();
    const result = await db.collection('tasks').updateOne(
      { _id: new ObjectId(taskId) },
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