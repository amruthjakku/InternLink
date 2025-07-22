#!/usr/bin/env node

/**
 * Simple script to activate all users in the database
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://amruthjakku:jS7fK5f2QwMZANut@cluster0.hc4q6ax.mongodb.net/internship_tracker';

async function activateAllUsers() {
  console.log('🚀 Starting user activation...\n');

  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to database');

    const db = client.db('internship_tracker');
    const usersCollection = db.collection('users');

    // Step 1: Get current user statistics
    console.log('\n📊 Current User Statistics:');
    const totalUsers = await usersCollection.countDocuments();
    const activeUsers = await usersCollection.countDocuments({ isActive: true });
    const inactiveUsers = await usersCollection.countDocuments({ isActive: false });
    
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Active users: ${activeUsers}`);
    console.log(`   Inactive users: ${inactiveUsers}`);

    // Step 2: Activate all users
    console.log('\n🔄 Activating all users...');
    const activationResult = await usersCollection.updateMany(
      { isActive: false },
      { 
        $set: { 
          isActive: true,
          reactivatedAt: new Date(),
          reactivationReason: 'System-wide activation - deactivation concept removed',
          reactivatedBy: 'system-migration',
          updatedAt: new Date()
        },
        $inc: { sessionVersion: 1 }
      }
    );

    console.log(`   ✅ Activated ${activationResult.modifiedCount} users`);

    // Step 3: Remove deactivation-related fields from all users
    console.log('\n🧹 Cleaning up deactivation fields...');
    const cleanupResult = await usersCollection.updateMany(
      {},
      {
        $unset: {
          deactivatedAt: 1,
          deactivationReason: 1,
          deactivatedBy: 1
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    console.log(`   ✅ Cleaned up fields from ${cleanupResult.modifiedCount} users`);

    // Step 4: Verify all users are now active
    console.log('\n✅ Verification:');
    const finalActiveUsers = await usersCollection.countDocuments({ isActive: true });
    const finalInactiveUsers = await usersCollection.countDocuments({ isActive: false });
    
    console.log(`   Active users: ${finalActiveUsers}`);
    console.log(`   Inactive users: ${finalInactiveUsers}`);

    if (finalInactiveUsers === 0) {
      console.log('   🎉 All users are now active!');
    } else {
      console.log('   ⚠️  Some users are still inactive - manual review needed');
    }

    // Step 5: Show sample of users
    console.log('\n👥 Sample of users:');
    const sampleUsers = await usersCollection.find({})
      .project({ gitlabUsername: 1, name: 1, role: 1, isActive: 1, reactivatedAt: 1 })
      .limit(10)
      .sort({ updatedAt: -1 })
      .toArray();

    sampleUsers.forEach(user => {
      console.log(`   ${user.isActive ? '✅' : '❌'} ${user.gitlabUsername} (${user.name}) - ${user.role}`);
    });

    console.log('\n🎯 Summary:');
    console.log(`   • Total users processed: ${totalUsers}`);
    console.log(`   • Users activated: ${activationResult.modifiedCount}`);
    console.log(`   • Users cleaned up: ${cleanupResult.modifiedCount}`);
    console.log(`   • All users are now active: ${finalInactiveUsers === 0 ? 'YES' : 'NO'}`);

    console.log('\n✅ User activation completed successfully!');

  } catch (error) {
    console.error('❌ Error during user activation:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
activateAllUsers()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });