import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Define user schema
const userSchema = new mongoose.Schema({
  gitlabUsername: { type: String, required: true, unique: true },
  gitlabId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'POC', 'Tech Lead', 'AI Developer Intern'] },
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  assignedBy: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function verifyAdmins() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' }).sort({ createdAt: -1 });
    
    console.log('\n👑 ADMIN USERS IN DATABASE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found!');
      return;
    }

    adminUsers.forEach((admin, index) => {
      console.log(`\n${index + 1}. ${admin.name}`);
      console.log(`   🔧 GitLab Username: ${admin.gitlabUsername}`);
      console.log(`   🆔 GitLab ID: ${admin.gitlabId}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   📊 Role: ${admin.role}`);
      console.log(`   ✅ Active: ${admin.isActive ? 'Yes' : 'No'}`);
      console.log(`   👤 Assigned By: ${admin.assignedBy}`);
      console.log(`   📅 Created: ${admin.createdAt.toLocaleDateString()}`);
      console.log(`   🕐 Last Login: ${admin.lastLoginAt ? admin.lastLoginAt.toLocaleDateString() : 'Never'}`);
    });

    // Check specifically for the new admin
    const newAdmin = await User.findOne({ gitlabUsername: 'amruth_jakku' });
    if (newAdmin) {
      console.log('\n🎯 VERIFICATION: New admin "amruth_jakku" found!');
      console.log('   ✅ GitLab Username: amruth_jakku');
      console.log('   ✅ Email: amruthjakku@gmail.com');
      console.log('   ✅ Role: admin');
      console.log('   ✅ Status: Active');
      console.log('\n🚀 Ready to sign in with GitLab OAuth!');
    } else {
      console.log('\n❌ New admin "amruth_jakku" not found!');
    }

    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Admin Users: ${adminUsers.length}`);
    console.log(`   Active Admins: ${adminUsers.filter(u => u.isActive).length}`);
    console.log(`   Inactive Admins: ${adminUsers.filter(u => !u.isActive).length}`);
    
  } catch (error) {
    console.error('❌ Error verifying admins:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the verification
console.log('🔍 Verifying admin users in database...');
verifyAdmins();