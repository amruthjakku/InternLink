#!/usr/bin/env node

/**
 * Update database roles to use proper capitalization:
 * "AI developer Intern" -> "AI Developer Intern"
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://amruthjakku:jS7fK5f2QwMZANut@cluster0.hc4q6ax.mongodb.net/internship_tracker';

async function updateDatabaseRoles() {
  console.log('🔄 Updating database roles to proper capitalization...');
  
  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('internship_tracker');
    
    // Update users collection
    const usersCollection = db.collection('users');
    
    // Find users with incorrect capitalization
    const result = await usersCollection.updateMany(
      { role: 'AI developer Intern' },
      { 
        $set: { 
          role: 'AI Developer Intern',
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} users from "AI developer Intern" to "AI Developer Intern"`);
    
    // Verify final state
    const users = await usersCollection.find({}).toArray();
    const roleCounts = {};
    
    users.forEach(user => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });
    
    console.log('\n📊 Final role distribution:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} users`);
    });
    
    // Check for any invalid roles
    const validRoles = ['admin', 'POC', 'Tech Lead', 'AI Developer Intern'];
    const invalidRoles = Object.keys(roleCounts).filter(role => !validRoles.includes(role));
    
    if (invalidRoles.length > 0) {
      console.log('\n⚠️  Invalid roles found:', invalidRoles);
    } else {
      console.log('\n✅ All roles are valid!');
    }
    
  } catch (error) {
    console.error('❌ Database update failed:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

updateDatabaseRoles().catch(console.error);