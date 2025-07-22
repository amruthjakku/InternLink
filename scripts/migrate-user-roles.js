#!/usr/bin/env node

/**
 * Migration script to update old user roles to new valid roles
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://amruthjakku:jS7fK5f2QwMZANut@cluster0.hc4q6ax.mongodb.net/internship_tracker';

// Role mapping from old to new
const ROLE_MAPPING = {
  'AI Developer Intern': 'AI Developer Intern',
  'Tech Lead': 'Tech Lead', 
  'POC': 'POC',
  'admin': 'admin', // Keep admin as is
  'undefined': 'AI Developer Intern', // Default for undefined
  'pending': 'AI Developer Intern' // Default for pending
};

async function migrateUserRoles() {
  console.log('🔄 Starting User Role Migration...\n');

  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('internship_tracker');
    const usersCollection = db.collection('users');

    // Get all users
    const users = await usersCollection.find({}).toArray();
    console.log(`📊 Found ${users.length} users to check\n`);

    const validRoles = ['admin', 'POC', 'Tech Lead', 'AI Developer Intern'];
    let migratedCount = 0;
    let skippedCount = 0;

    console.log('🔄 Processing users:');
    console.log('===================');

    for (const user of users) {
      const currentRole = user.role || 'undefined';
      const username = user.gitlabUsername || 'undefined';
      const name = user.name || 'undefined';

      if (validRoles.includes(currentRole)) {
        console.log(`✅ ${username} (${name}) - Role "${currentRole}" is already valid`);
        skippedCount++;
        continue;
      }

      const newRole = ROLE_MAPPING[currentRole] || 'AI Developer Intern';
      
      try {
        await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: { 
              role: newRole,
              assignedBy: user.assignedBy || 'role-migration',
              updatedAt: new Date()
            }
          }
        );

        console.log(`🔄 ${username} (${name}) - "${currentRole}" → "${newRole}"`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Failed to update ${username}: ${error.message}`);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log('====================');
    console.log(`   • Total users: ${users.length}`);
    console.log(`   • Migrated: ${migratedCount}`);
    console.log(`   • Skipped (already valid): ${skippedCount}`);

    // Verify the migration
    console.log('\n🔍 Post-migration verification:');
    const updatedUsers = await usersCollection.find({}).toArray();
    const roleCount = {};
    
    updatedUsers.forEach(user => {
      const role = user.role || 'undefined';
      roleCount[role] = (roleCount[role] || 0) + 1;
    });
    
    console.log('   Role distribution:');
    Object.entries(roleCount).forEach(([role, count]) => {
      const isValid = validRoles.includes(role);
      console.log(`   • ${role}: ${count} users ${isValid ? '✅' : '❌'}`);
    });

    const invalidUsers = updatedUsers.filter(user => !validRoles.includes(user.role));
    console.log(`\n   Invalid roles remaining: ${invalidUsers.length} ${invalidUsers.length === 0 ? '✅' : '❌'}`);

    if (invalidUsers.length === 0) {
      console.log('\n🎉 Migration completed successfully! All users now have valid roles.');
    } else {
      console.log('\n⚠️  Some users still have invalid roles - manual review needed.');
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

migrateUserRoles().catch(console.error);