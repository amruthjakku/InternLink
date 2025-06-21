#!/usr/bin/env node
/**
 * Admin Bootstrap Script for Internship Tracker
 * 
 * Usage:
 *   node scripts/create-admin.js --gitlab-username=amruthjakku --name="Amruth Jakku" --email="amruth@example.com"
 * 
 * This script creates the first admin user in the database.
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

async function createAdmin(gitlabUsername, name, email, gitlabId = null) {
  try {
    // Load environment variables
    loadEnvFile();
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/internship_tracker';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      gitlabUsername: gitlabUsername.toLowerCase()
    });
    
    if (existingAdmin) {
      console.log(`❌ Admin with GitLab username '${gitlabUsername}' already exists!`);
      return false;
    }
    
    // Check if any admin exists
    const existingAdminsCount = await User.countDocuments({ role: 'admin' });
    
    // Create admin user
    const adminUser = new User({
      gitlabUsername: gitlabUsername.toLowerCase(),
      gitlabId: gitlabId || `admin_${gitlabUsername.toLowerCase()}`,
      name: name,
      email: email.toLowerCase(),
      role: 'admin',
      assignedBy: 'system_bootstrap',
      isActive: true,
      profileImage: null,
      lastLoginAt: null
    });
    
    // Save admin user
    const savedUser = await adminUser.save();
    
    console.log('✅ Successfully created admin user!');
    console.log(`   GitLab Username: ${gitlabUsername}`);
    console.log(`   Name: ${name}`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: admin`);
    console.log(`   User ID: ${savedUser._id}`);
    
    if (existingAdminsCount === 0) {
      console.log('🎉 This is the first admin user in the system!');
    } else {
      console.log(`📊 Total admins in system: ${existingAdminsCount + 1}`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
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
  
  if (!args.gitlab_username || !args.name || !args.email) {
    console.log('❌ Missing required arguments!');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/create-admin.js --gitlab-username=USERNAME --name="FULL NAME" --email="EMAIL"');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/create-admin.js --gitlab-username=amruthjakku --name="Amruth Jakku" --email="amruth@example.com"');
    process.exit(1);
  }
  
  console.log('🚀 Creating admin user for Internship Tracker...');
  console.log(`   GitLab Username: ${args.gitlab_username}`);
  console.log(`   Name: ${args.name}`);
  console.log(`   Email: ${args.email}`);
  console.log('');
  
  const success = await createAdmin(
    args.gitlab_username,
    args.name,
    args.email,
    args.gitlab_id
  );
  
  if (success) {
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Start your Next.js application: npm run dev');
    console.log('2. Login with your GitLab account');
    console.log('3. You\'ll be automatically recognized as an admin');
    console.log('4. Use the admin dashboard to add mentors and colleges');
    process.exit(0);
  } else {
    console.log('');
    console.log('❌ Failed to create admin user. Please check the error above.');
    process.exit(1);
  }
}

main().catch(console.error);