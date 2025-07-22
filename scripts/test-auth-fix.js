#!/usr/bin/env node

/**
 * Test script to verify the auth fix works
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://amruthjakku:jS7fK5f2QwMZANut@cluster0.hc4q6ax.mongodb.net/internship_tracker';

async function testAuthFix() {
  console.log('🧪 Testing Auth Fix...\n');

  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('internship_tracker');
    const usersCollection = db.collection('users');

    // Check current role distribution
    console.log('📊 Current Role Distribution:');
    const users = await usersCollection.find({}).toArray();
    const roleCount = {};
    
    users.forEach(user => {
      const role = user.role || 'undefined';
      roleCount[role] = (roleCount[role] || 0) + 1;
    });
    
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} users`);
    });

    // Check for any pending users
    const pendingUsers = await usersCollection.find({ role: 'pending' }).toArray();
    console.log(`\n🔍 Pending users: ${pendingUsers.length}`);
    
    if (pendingUsers.length > 0) {
      console.log('   ⚠️  Found pending users - these should be updated:');
      pendingUsers.forEach(user => {
        console.log(`   - ${user.gitlabUsername} (${user.name})`);
      });
    }

    // Check for users with invalid roles
    const validRoles = ['admin', 'POC', 'Tech Lead', 'AI Developer Intern'];
    const invalidRoleUsers = users.filter(user => !validRoles.includes(user.role));
    
    console.log(`\n🔍 Users with invalid roles: ${invalidRoleUsers.length}`);
    if (invalidRoleUsers.length > 0) {
      console.log('   ⚠️  Found users with invalid roles:');
      invalidRoleUsers.forEach(user => {
        console.log(`   - ${user.gitlabUsername || 'undefined'} has role: "${user.role || 'undefined'}"`);
      });
    }

    // Summary
    console.log('\n✅ Auth Fix Status:');
    console.log(`   • Total users: ${users.length}`);
    console.log(`   • Pending users: ${pendingUsers.length} ${pendingUsers.length === 0 ? '✅' : '❌'}`);
    console.log(`   • Invalid role users: ${invalidRoleUsers.length} ${invalidRoleUsers.length === 0 ? '✅' : '⚠️'}`);
    console.log(`   • System ready for new GitLab users: ${pendingUsers.length === 0 ? 'YES ✅' : 'NO ❌'}`);

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

testAuthFix().catch(console.error);