/**
 * Utility to ensure all models are loaded and registered with Mongoose
 * This helps prevent "MissingSchemaError" when models reference each other
 * 
 * This implementation uses the centralized connection manager to ensure
 * efficient connection reuse across API routes
 */

import mongoose from 'mongoose';
import { connectToDatabase, getModel as getMongooseModel } from '../lib/mongoose';

// Import all models - using dynamic imports to prevent multiple compilations
let modelCache = {};

/**
 * Ensures all models are registered with Mongoose
 * Call this function before performing operations that might use multiple models
 */
export async function ensureAllModelsRegistered() {
  // Connect to the database first
  await connectToDatabase();
  
  // If models are already cached, return them
  if (Object.keys(modelCache).length > 0) {
    return modelCache;
  }
  
  // Import models dynamically to prevent multiple compilations
  const [
    UserModule,
    CollegeModule,
    CohortModule,
    TaskModule,
    AttendanceModule,
    MessageModule,
    ChatRoomModule,
    ActivityTrackingModule,
    GitLabIntegrationModule
  ] = await Promise.all([
    import('../models/User'),
    import('../models/College'),
    import('../models/Cohort'),
    import('../models/Task'),
    import('../models/Attendance'),
    import('../models/Message'),
    import('../models/ChatRoom'),
    import('../models/ActivityTracking'),
    import('../models/GitLabIntegration')
  ]);
  
  // Cache the models
  modelCache = {
    User: UserModule.default,
    College: CollegeModule.default,
    Cohort: CohortModule.default,
    Task: TaskModule.default,
    Attendance: AttendanceModule.default,
    Message: MessageModule.default,
    ChatRoom: ChatRoomModule.default,
    ActivityTracking: ActivityTrackingModule.default,
    GitLabIntegration: GitLabIntegrationModule.default
  };
  
  // Log registered models for debugging
  const registeredModels = Object.keys(mongoose.models);
  console.log('Registered Mongoose models:', registeredModels);
  
  return modelCache;
}

/**
 * Gets a registered model by name, or registers it if not already registered
 * @param {string} modelName - The name of the model to get
 * @returns The Mongoose model
 */
export async function getModel(modelName) {
  try {
    // Connect to the database first
    await connectToDatabase();
    
    // Check if model is already cached
    if (modelCache[modelName]) {
      return modelCache[modelName];
    }
    
    // Check if model is already registered with Mongoose
    if (mongoose.models[modelName]) {
      modelCache[modelName] = mongoose.models[modelName];
      return modelCache[modelName];
    }
    
    // If not registered, try to import and register it
    const module = await import(`../models/${modelName}`);
    modelCache[modelName] = module.default;
    return modelCache[modelName];
  } catch (error) {
    console.error(`Error getting model ${modelName}:`, error);
    throw error;
  }
}