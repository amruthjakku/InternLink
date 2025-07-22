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
  role: { type: String, required: true, enum: ['admin', 'POC', 'Tech Lead', 'AI developer Intern'] },
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  assignedBy: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createAmruthAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin user already exists with this exact username
    const existingAdmin = await User.findOne({ gitlabUsername: 'amruth_jakku' });
    if (existingAdmin) {
      console.log('❌ Admin user with username "amruth_jakku" already exists:');
      console.log('   Name:', existingAdmin.name);
      console.log('   Email:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
      console.log('   Active:', existingAdmin.isActive);
      console.log('   Created:', existingAdmin.createdAt);
      return;
    }

    // Check if email already exists (as user mentioned it might)
    const existingEmail = await User.findOne({ email: 'amruthjakku@gmail.com' });
    if (existingEmail) {
      console.log('⚠️ Email "amruthjakku@gmail.com" already exists for user:');
      console.log('   GitLab Username:', existingEmail.gitlabUsername);
      console.log('   Name:', existingEmail.name);
      console.log('   Role:', existingEmail.role);
      console.log('   Active:', existingEmail.isActive);
      console.log('\n🔄 Creating new admin with same email but different GitLab username...');
    }

    // Create new admin user with GitLab username: amruth_jakku
    const adminUser = new User({
      gitlabUsername: 'amruth_jakku',
      gitlabId: '28379522', // Different GitLab ID to avoid conflicts
      name: 'Amruth Jakku',
      email: 'amruthjakku@gmail.com',
      role: 'admin',
      assignedBy: 'System',
      isActive: true,
      lastLoginAt: new Date()
    });

    await adminUser.save();
    console.log('\n✅ New admin user created successfully!');
    console.log('   GitLab Username:', adminUser.gitlabUsername);
    console.log('   GitLab ID:', adminUser.gitlabId);
    console.log('   Name:', adminUser.name);
    console.log('   Email:', adminUser.email);
    console.log('   Role:', adminUser.role);
    console.log('   Active:', adminUser.isActive);
    console.log('   Created:', adminUser.createdAt);

    console.log('\n🎉 Admin user "amruth_jakku" is now ready!');
    console.log('You can sign in with your GitLab account using username: amruth_jakku');
    
  } catch (error) {
    if (error.code === 11000) {
      console.error('❌ Duplicate key error:', error.message);
      if (error.message.includes('gitlabUsername')) {
        console.error('   GitLab username "amruth_jakku" already exists');
      }
      if (error.message.includes('gitlabId')) {
        console.error('   GitLab ID already exists');
      }
      if (error.message.includes('email')) {
        console.error('   Email already exists');
      }
    } else {
      console.error('❌ Error creating admin user:', error);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
console.log('🚀 Creating admin user with GitLab username: amruth_jakku');
console.log('📧 Email: amruthjakku@gmail.com');
console.log('👤 Role: admin');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

createAmruthAdmin();