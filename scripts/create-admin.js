import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Define schemas directly in the script
const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  website: { type: String, default: '' },
  mentorUsername: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

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

const College = mongoose.model('College', collegeSchema);
const User = mongoose.model('User', userSchema);

async function createTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ gitlabUsername: 'amruthjakku' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.name);
      return;
    }

    // Create a test college
    let testCollege = await College.findOne({ name: 'Test University' });
    if (!testCollege) {
      testCollege = new College({
        name: 'Test University',
        description: 'A test university for development',
        location: 'Test City, TC',
        website: 'https://test-university.edu',
        mentorUsername: 'testmentor',
        isActive: true
      });
      await testCollege.save();
      console.log('Test college created:', testCollege.name);
    } else {
      console.log('Test college already exists:', testCollege.name);
    }

    // Create test admin user (using your GitLab info)
    const adminUser = new User({
      gitlabUsername: 'amruthjakku',
      gitlabId: '28379521',
      name: 'AJ',
      email: 'amruthjakku@gmail.com',
      role: 'admin',
      assignedBy: 'System',
      isActive: true,
      lastLoginAt: new Date()
    });

    await adminUser.save();
    console.log('Admin user created:', adminUser.name);

    // Create test mentor user
    const existingMentor = await User.findOne({ gitlabUsername: 'testmentor' });
    if (!existingMentor) {
      const mentorUser = new User({
        gitlabUsername: 'testmentor',
        gitlabId: 'mentor123',
        name: 'Test Mentor',
        email: 'mentor@test.edu',
        role: 'Tech Lead',
        college: testCollege._id,
        assignedBy: 'Admin',
        isActive: true
      });
      await mentorUser.save();
      console.log('Mentor user created:', mentorUser.name);
    }

    // Create test intern user
    const existingIntern = await User.findOne({ gitlabUsername: 'testintern' });
    if (!existingIntern) {
      const internUser = new User({
        gitlabUsername: 'testintern',
        gitlabId: 'intern123',
        name: 'Test Intern',
        email: 'intern@test.edu',
        role: 'AI developer Intern',
        college: testCollege._id,
        assignedBy: 'Test Mentor',
        isActive: true
      });
      await internUser.save();
      console.log('Intern user created:', internUser.name);
    }

    console.log('\n✅ Test data created successfully!');
    console.log('You can now sign in with your GitLab account and access the admin dashboard.');
    
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestData();