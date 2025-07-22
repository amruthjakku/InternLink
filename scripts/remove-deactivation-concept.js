#!/usr/bin/env node

/**
 * Script to remove the deactivation concept from the AI Developer InternLink system
 * - Removes deactivation-related fields from User model
 * - Sets all users to active
 * - Updates all code references to remove isActive checks
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import User from '../models/User.js';
import { connectToDatabase } from '../utils/database.js';

dotenv.config({ path: '.env.local' });

// Ensure MONGODB_URI is set
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb+srv://amruthjakku:jS7fK5f2QwMZANut@cluster0.hc4q6ax.mongodb.net/internship_tracker';
}

async function removeDeactivationConcept() {
  console.log('🚀 Starting deactivation concept removal...\n');

  try {
    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to database');

    // Step 1: Get current user statistics
    console.log('\n📊 Current User Statistics:');
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Active users: ${activeUsers}`);
    console.log(`   Inactive users: ${inactiveUsers}`);

    // Step 2: Activate all users
    console.log('\n🔄 Activating all users...');
    const activationResult = await User.updateMany(
      { isActive: false },
      { 
        $set: { 
          isActive: true,
          reactivatedAt: new Date(),
          reactivationReason: 'System-wide activation - deactivation concept removed',
          reactivatedBy: 'system-migration'
        },
        $inc: { sessionVersion: 1 }
      }
    );

    console.log(`   ✅ Activated ${activationResult.modifiedCount} users`);

    // Step 3: Remove deactivation-related fields from all users
    console.log('\n🧹 Cleaning up deactivation fields...');
    const cleanupResult = await User.updateMany(
      {},
      {
        $unset: {
          deactivatedAt: 1,
          deactivationReason: 1,
          deactivatedBy: 1
        }
      }
    );

    console.log(`   ✅ Cleaned up fields from ${cleanupResult.modifiedCount} users`);

    // Step 4: Verify all users are now active
    console.log('\n✅ Verification:');
    const finalActiveUsers = await User.countDocuments({ isActive: true });
    const finalInactiveUsers = await User.countDocuments({ isActive: false });
    
    console.log(`   Active users: ${finalActiveUsers}`);
    console.log(`   Inactive users: ${finalInactiveUsers}`);

    if (finalInactiveUsers === 0) {
      console.log('   🎉 All users are now active!');
    } else {
      console.log('   ⚠️  Some users are still inactive - manual review needed');
    }

    // Step 5: Show sample of users
    console.log('\n👥 Sample of users:');
    const sampleUsers = await User.find({})
      .select('gitlabUsername name role isActive reactivatedAt')
      .limit(10)
      .sort({ updatedAt: -1 });

    sampleUsers.forEach(user => {
      console.log(`   ${user.isActive ? '✅' : '❌'} ${user.gitlabUsername} (${user.name}) - ${user.role}`);
    });

    console.log('\n🎯 Summary:');
    console.log(`   • Total users processed: ${totalUsers}`);
    console.log(`   • Users activated: ${activationResult.modifiedCount}`);
    console.log(`   • Users cleaned up: ${cleanupResult.modifiedCount}`);
    console.log(`   • All users are now active: ${finalInactiveUsers === 0 ? 'YES' : 'NO'}`);

    console.log('\n✅ Deactivation concept removal completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update User model to remove deactivation fields');
    console.log('   2. Remove isActive checks from authentication middleware');
    console.log('   3. Update API endpoints to remove isActive filtering');
    console.log('   4. Update UI components to remove activation/deactivation features');

  } catch (error) {
    console.error('❌ Error during deactivation concept removal:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
removeDeactivationConcept()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

export { removeDeactivationConcept };