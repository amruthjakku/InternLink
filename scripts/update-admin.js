#!/usr/bin/env node
/**
 * Admin Update Script for Internship Tracker
 * 
 * Usage:
 *   node scripts/update-admin.js --gitlab-username=amruthjakku --email="amruthjakku@gmail.com"
 * 
 * This script updates an existing admin user's information.
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load environment variables
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key] = value;
      }
    });
  }
}

// User schema (simplified for script)
const userSchema = new mongoose.Schema({
  gitlabUsername: { type: String, required: true, unique: true },
  gitlabId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'mentor', 'intern'] },
  assignedBy: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  profileImage: { type: String, default: null },
  lastLoginAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function updateAdmin(gitlabUsername, updates) {
  try {
    // Load environment variables
    loadEnvFile();
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/internship_tracker';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB');
    
    // Find the admin user
    const adminUser = await User.findOne({
      gitlabUsername: gitlabUsername.toLowerCase(),
      role: 'admin'
    });
    
    if (!adminUser) {
      console.log(`❌ Admin user with GitLab username '${gitlabUsername}' not found!`);
      return false;
    }
    
    console.log('📋 Current admin user details:');
    console.log(`   GitLab Username: ${adminUser.gitlabUsername}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log('');
    
    // Update the user
    const updatedFields = {};
    if (updates.email) {
      updatedFields.email = updates.email.toLowerCase();
    }
    if (updates.name) {
      updatedFields.name = updates.name;
    }
    
    // Add updatedAt timestamp
    updatedFields.updatedAt = new Date();
    
    const updatedUser = await User.findByIdAndUpdate(
      adminUser._id,
      updatedFields,
      { new: true }
    );
    
    console.log('✅ Successfully updated admin user!');
    console.log('📋 Updated admin user details:');
    console.log(`   GitLab Username: ${updatedUser.gitlabUsername}`);
    console.log(`   Name: ${updatedUser.name}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Role: ${updatedUser.role}`);
    console.log(`   Last Updated: ${updatedUser.updatedAt}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error updating admin:', error.message);
    return false;
  } finally {
    await mongoose.disconnect();
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      parsed[key.replace(/-/g, '_')] = value;
    }
  });
  
  return parsed;
}

async function main() {
  const args = parseArgs();
  
  if (!args.gitlab_username) {
    console.log('❌ Missing required argument: --gitlab-username');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/update-admin.js --gitlab-username=USERNAME [--email="EMAIL"] [--name="NAME"]');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/update-admin.js --gitlab-username=amruthjakku --email="amruthjakku@gmail.com"');
    console.log('  node scripts/update-admin.js --gitlab-username=amruthjakku --name="Amruth Jakku" --email="amruthjakku@gmail.com"');
    process.exit(1);
  }
  
  if (!args.email && !args.name) {
    console.log('❌ At least one field to update is required (--email or --name)');
    process.exit(1);
  }
  
  console.log('🔄 Updating admin user for Internship Tracker...');
  console.log(`   GitLab Username: ${args.gitlab_username}`);
  if (args.email) console.log(`   New Email: ${args.email}`);
  if (args.name) console.log(`   New Name: ${args.name}`);
  console.log('');
  
  const updates = {};
  if (args.email) updates.email = args.email;
  if (args.name) updates.name = args.name;
  
  const success = await updateAdmin(args.gitlab_username, updates);
  
  if (success) {
    console.log('');
    console.log('🎯 Admin user updated successfully!');
    console.log('✅ You can now login with your GitLab account and the updated information will be used.');
    process.exit(0);
  } else {
    console.log('');
    console.log('❌ Failed to update admin user. Please check the error above.');
    process.exit(1);
  }
}

main().catch(console.error);