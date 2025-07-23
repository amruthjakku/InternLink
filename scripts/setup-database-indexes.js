#!/usr/bin/env node

/**
 * Database Index Setup Script  
 * Creates optimal indexes for performance and ensures database integrity
 */

import { connectToDatabase } from '../lib/mongoose.js';
import mongoose from 'mongoose';

// Import models to register schemas
import '../models/User.js';
import '../models/College.js';
import '../models/Cohort.js';
import '../models/Task.js';
import '../models/GitLabIntegration.js';
import '../models/Attendance.js';

const indexes = {
  // User indexes
  users: [
    { gitlabUsername: 1 },                    // Unique login lookup
    { gitlabId: 1 },                          // GitLab integration
    { email: 1 },                             // Email lookup
    { role: 1 },                              // Role-based queries
    { college: 1 },                           // College-based filtering
    { cohortId: 1 },                          // Cohort-based queries
    { assignedTechLead: 1 },                  // Tech lead assignments
    { isActive: 1 },                          // Active user filtering
    { createdAt: -1 },                        // Recent users first
    { lastLoginAt: -1 },                      // Recent activity
    { role: 1, college: 1 },                  // Compound: role + college
    { role: 1, isActive: 1 },                 // Compound: role + active status
    { college: 1, cohortId: 1 },              // Compound: college + cohort
  ],

  // College indexes
  colleges: [
    { name: 1 },                              // College name lookup
    { isActive: 1 },                          // Active colleges
    { createdAt: -1 },                        // Recent colleges first
  ],

  // Cohort indexes
  cohorts: [
    { name: 1 },                              // Cohort name lookup
    { college: 1 },                           // College-based cohorts
    { isActive: 1 },                          // Active cohorts
    { startDate: -1 },                        // Recent cohorts first
    { college: 1, isActive: 1 },              // Compound: college + active
  ],

  // Task indexes
  tasks: [
    { title: 1 },                             // Task title search
    { category: 1 },                          // Category filtering
    { status: 1 },                            // Status filtering
    { priority: 1 },                          // Priority filtering
    { assignedTo: 1 },                        // User assignments
    { cohortId: 1 },                          // Cohort assignments
    { dueDate: 1 },                           // Due date sorting
    { createdAt: -1 },                        // Recent tasks first
    { status: 1, dueDate: 1 },                // Compound: status + due date
    { assignedTo: 1, status: 1 },             // Compound: user + status
    { cohortId: 1, status: 1 },               // Compound: cohort + status
    { category: 1, status: 1 },               // Compound: category + status
  ],

  // GitLab Integration indexes
  gitlabintegrations: [
    { userId: 1 },                            // User lookup (should be unique)
    { gitlabUserId: 1 },                      // GitLab user ID lookup
    { gitlabUsername: 1 },                    // GitLab username lookup
    { isConnected: 1 },                       // Connection status
    { tokenExpiresAt: 1 },                    // Token expiration
    { lastSyncAt: -1 },                       // Recent sync activity
  ],

  // Attendance indexes
  attendances: [
    { userId: 1 },                            // User attendance
    { date: -1 },                             // Date-based queries
    { status: 1 },                            // Status filtering
    { userId: 1, date: -1 },                  // Compound: user + date
    { date: -1, status: 1 },                  // Compound: date + status
    { createdAt: -1 },                        // Recent records first
  ],

  // Task Progress indexes (if exists)
  taskprogresses: [
    { userId: 1 },                            // User progress
    { taskId: 1 },                            // Task progress
    { status: 1 },                            // Progress status
    { userId: 1, taskId: 1 },                 // Compound: user + task (should be unique)
    { taskId: 1, status: 1 },                 // Compound: task + status
    { updatedAt: -1 },                        // Recent updates first
  ],

  // Announcements indexes (if exists)
  announcements: [
    { isActive: 1 },                          // Active announcements
    { targetRole: 1 },                        // Role-based announcements
    { targetCohort: 1 },                      // Cohort-based announcements
    { createdAt: -1 },                        // Recent announcements first
    { priority: -1 },                         // Priority sorting
  ],
};

async function createIndexes() {
  console.log('🔧 Setting up database indexes...\n');
  
  let created = 0;
  let errors = 0;

  try {
    await connectToDatabase();
    const db = mongoose.connection.db;

    for (const [collectionName, indexList] of Object.entries(indexes)) {
      console.log(`📊 Processing collection: ${collectionName}`);
      
      // Check if collection exists
      const collections = await db.listCollections({ name: collectionName }).toArray();
      if (collections.length === 0) {
        console.log(`   ⚠️  Collection ${collectionName} doesn't exist, skipping...`);
        continue;
      }

      const collection = db.collection(collectionName);
      
      // Get existing indexes
      const existingIndexes = await collection.indexes();
      const existingIndexNames = new Set(existingIndexes.map(idx => {
        // Convert index key to string for comparison
        return JSON.stringify(idx.key);
      }));

      for (const indexSpec of indexList) {
        const indexKey = JSON.stringify(indexSpec);
        
        if (existingIndexNames.has(indexKey)) {
          console.log(`   ✅ Index ${indexKey} already exists`);
          continue;
        }

        try {
          await collection.createIndex(indexSpec, {
            background: true,  // Create in background
            sparse: true,      // Skip null values for most indexes
          });
          console.log(`   ✅ Created index: ${indexKey}`);
          created++;
        } catch (error) {
          console.log(`   ❌ Failed to create index ${indexKey}: ${error.message}`);
          errors++;
        }
      }
    }

    // Create text indexes for search functionality
    console.log('\n📝 Creating text search indexes...');
    
    const textIndexes = [
      {
        collection: 'users',
        fields: { name: 'text', gitlabUsername: 'text', email: 'text' },
        name: 'user_search'
      },
      {
        collection: 'tasks',
        fields: { title: 'text', description: 'text' },
        name: 'task_search'
      },
      {
        collection: 'colleges',
        fields: { name: 'text', description: 'text' },
        name: 'college_search'
      }
    ];

    for (const textIndex of textIndexes) {
      try {
        const collection = db.collection(textIndex.collection);
        const existingIndexes = await collection.indexes();
        const hasTextIndex = existingIndexes.some(idx => idx.name === textIndex.name);
        
        if (!hasTextIndex) {
          await collection.createIndex(textIndex.fields, { 
            name: textIndex.name,
            background: true 
          });
          console.log(`   ✅ Created text index: ${textIndex.name}`);
          created++;
        } else {
          console.log(`   ✅ Text index ${textIndex.name} already exists`);
        }
      } catch (error) {
        console.log(`   ❌ Failed to create text index ${textIndex.name}: ${error.message}`);
        errors++;
      }
    }

    console.log(`\n📊 Index creation summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Errors: ${errors}`);
    
    if (created > 0) {
      console.log('\n✨ Database indexes have been optimized!');
      console.log('🚀 Your application should now have better query performance.');
    } else {
      console.log('\n✅ All indexes are already up to date!');
    }

  } catch (error) {
    console.error('\n❌ Error setting up indexes:', error);
    process.exit(1);
  }
}

async function analyzeIndexUsage() {
  console.log('\n🔍 Analyzing index usage...');
  
  try {
    const db = mongoose.connection.db;
    const collections = ['users', 'tasks', 'attendances', 'gitlabintegrations'];
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const stats = await collection.stats();
        
        console.log(`\n📊 ${collectionName}:`);
        console.log(`   Documents: ${stats.count}`);
        console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Index Size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
        
        // Get index usage stats if available
        const indexes = await collection.indexes();
        console.log(`   Indexes: ${indexes.length}`);
        
      } catch (error) {
        console.log(`   ⚠️  Could not analyze ${collectionName}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error analyzing index usage:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldAnalyze = args.includes('--analyze');

  await createIndexes();
  
  if (shouldAnalyze) {
    await analyzeIndexUsage();
  }

  console.log('\n💡 Tips for optimal performance:');
  console.log('   - Monitor slow queries in production');
  console.log('   - Consider adding more specific compound indexes based on usage patterns');
  console.log('   - Regularly analyze index usage with --analyze flag');
  console.log('   - Remove unused indexes to save space');
  
  process.exit(0);
}

main().catch(console.error);