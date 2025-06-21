import { MongoClient, ObjectId } from 'mongodb';
import mongoose from 'mongoose';

let client;
let clientPromise;

if (process.env.MONGODB_URI) {
  client = new MongoClient(process.env.MONGODB_URI);
  clientPromise = client.connect();
} else {
  // For demo mode, we'll use in-memory storage
  console.warn('No MongoDB URI provided, using demo mode');
}

// Database helper functions
export async function getDatabase() {
  if (!clientPromise) {
    throw new Error('Database not configured. Using demo mode.');
  }
  const client = await clientPromise;
  return client.db('internship_tracker');
}

// Mongoose connection helper
export async function connectToDatabase() {
  if (mongoose.connections[0].readyState) {
    return mongoose.connections[0];
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MongoDB URI not configured');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB via Mongoose');
    return mongoose.connections[0];
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// Demo data storage (in-memory for demo mode)
let demoData = {
  users: [],
  colleges: [],
  cohorts: [],
  joinRequests: []
};

// Helper to check if we're in demo mode
const isDemoMode = () => !process.env.MONGODB_URI || process.env.DEMO_MODE === 'true';

// User operations
export async function createUser(userData) {
  try {
    if (isDemoMode()) {
      const newUser = {
        _id: new ObjectId().toString(),
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        onboardingComplete: false
      };
      demoData.users.push(newUser);
      return newUser._id;
    }

    const db = await getDatabase();
    const result = await db.collection('users').insertOne({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      onboardingComplete: false
    });
    return result.insertedId;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getUserByGitLabId(gitlabId) {
  try {
    if (isDemoMode()) {
      return demoData.users.find(user => user.gitlabId === String(gitlabId));
    }

    const db = await getDatabase();
    return await db.collection('users').findOne({ gitlabId: String(gitlabId) });
  } catch (error) {
    console.error('Error fetching user by GitLab ID:', error);
    throw error;
  }
}

export async function updateUser(userId, updateData) {
  try {
    if (isDemoMode()) {
      const userIndex = demoData.users.findIndex(user => user._id === userId);
      if (userIndex !== -1) {
        demoData.users[userIndex] = {
          ...demoData.users[userIndex],
          ...updateData,
          updatedAt: new Date()
        };
        return true;
      }
      return false;
    }

    const db = await getDatabase();
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// College operations
export async function createCollege(collegeData) {
  try {
    const newCollege = {
      _id: new ObjectId().toString(),
      ...collegeData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    if (isDemoMode()) {
      demoData.colleges.push(newCollege);
      return newCollege._id;
    }

    const db = await getDatabase();
    const result = await db.collection('colleges').insertOne(newCollege);
    return result.insertedId;
  } catch (error) {
    console.error('Error creating college:', error);
    throw error;
  }
}

export async function getAllColleges() {
  try {
    if (isDemoMode()) {
      return demoData.colleges.filter(college => college.isActive);
    }

    const db = await getDatabase();
    return await db.collection('colleges').find({ isActive: true }).toArray();
  } catch (error) {
    console.error('Error fetching colleges:', error);
    throw error;
  }
}

export async function getCollegeById(collegeId) {
  try {
    if (isDemoMode()) {
      return demoData.colleges.find(college => college._id === collegeId);
    }

    const db = await getDatabase();
    return await db.collection('colleges').findOne({ _id: new ObjectId(collegeId) });
  } catch (error) {
    console.error('Error fetching college:', error);
    throw error;
  }
}

export async function getCollegesByMentor(mentorId) {
  try {
    if (isDemoMode()) {
      return demoData.colleges.filter(college => 
        college.createdBy === mentorId && college.isActive
      );
    }

    const db = await getDatabase();
    return await db.collection('colleges').find({ 
      createdBy: mentorId,
      isActive: true 
    }).toArray();
  } catch (error) {
    console.error('Error fetching colleges by mentor:', error);
    throw error;
  }
}

// Cohort operations
export async function createCohort(cohortData) {
  try {
    const newCohort = {
      _id: new ObjectId().toString(),
      ...cohortData,
      currentInterns: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    if (isDemoMode()) {
      demoData.cohorts.push(newCohort);
      return newCohort._id;
    }

    const db = await getDatabase();
    const result = await db.collection('cohorts').insertOne(newCohort);
    return result.insertedId;
  } catch (error) {
    console.error('Error creating cohort:', error);
    throw error;
  }
}

export async function getCohortsByCollege(collegeId) {
  try {
    if (isDemoMode()) {
      return demoData.cohorts.filter(cohort => 
        cohort.collegeId === collegeId && cohort.isActive
      );
    }

    const db = await getDatabase();
    return await db.collection('cohorts').find({ 
      collegeId: new ObjectId(collegeId),
      isActive: true 
    }).toArray();
  } catch (error) {
    console.error('Error fetching cohorts:', error);
    throw error;
  }
}

export async function getCohortById(cohortId) {
  try {
    if (isDemoMode()) {
      return demoData.cohorts.find(cohort => cohort._id === cohortId);
    }

    const db = await getDatabase();
    return await db.collection('cohorts').findOne({ _id: new ObjectId(cohortId) });
  } catch (error) {
    console.error('Error fetching cohort:', error);
    throw error;
  }
}

export async function updateCohort(cohortId, updateData) {
  try {
    if (isDemoMode()) {
      const cohortIndex = demoData.cohorts.findIndex(cohort => cohort._id === cohortId);
      if (cohortIndex !== -1) {
        demoData.cohorts[cohortIndex] = {
          ...demoData.cohorts[cohortIndex],
          ...updateData,
          updatedAt: new Date()
        };
        return true;
      }
      return false;
    }

    const db = await getDatabase();
    const result = await db.collection('cohorts').updateOne(
      { _id: new ObjectId(cohortId) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating cohort:', error);
    throw error;
  }
}

// Join request operations
export async function createJoinRequest(requestData) {
  try {
    const newRequest = {
      _id: new ObjectId().toString(),
      ...requestData,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isDemoMode()) {
      demoData.joinRequests.push(newRequest);
      return newRequest._id;
    }

    const db = await getDatabase();
    const result = await db.collection('joinRequests').insertOne(newRequest);
    return result.insertedId;
  } catch (error) {
    console.error('Error creating join request:', error);
    throw error;
  }
}

export async function getJoinRequestsByMentor(mentorId) {
  try {
    if (isDemoMode()) {
      return demoData.joinRequests.filter(request => request.mentorId === mentorId);
    }

    const db = await getDatabase();
    return await db.collection('joinRequests').find({ mentorId }).toArray();
  } catch (error) {
    console.error('Error fetching join requests:', error);
    throw error;
  }
}

export async function getJoinRequestsByIntern(internId) {
  try {
    if (isDemoMode()) {
      return demoData.joinRequests.filter(request => request.internId === internId);
    }

    const db = await getDatabase();
    return await db.collection('joinRequests').find({ internId }).toArray();
  } catch (error) {
    console.error('Error fetching join requests for intern:', error);
    throw error;
  }
}

export async function updateJoinRequest(requestId, updateData) {
  try {
    if (isDemoMode()) {
      const requestIndex = demoData.joinRequests.findIndex(request => request._id === requestId);
      if (requestIndex !== -1) {
        demoData.joinRequests[requestIndex] = {
          ...demoData.joinRequests[requestIndex],
          ...updateData,
          updatedAt: new Date(),
          reviewedAt: new Date()
        };
        return true;
      }
      return false;
    }

    const db = await getDatabase();
    const result = await db.collection('joinRequests').updateOne(
      { _id: new ObjectId(requestId) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date(),
          reviewedAt: new Date()
        } 
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating join request:', error);
    throw error;
  }
}

// Demo data seeding
export async function seedDemoData() {
  try {
    console.log('🌱 Seeding demo data...');

    // Create demo mentor
    const demoMentor = {
      _id: 'demo_mentor_1',
      name: 'Dr. Sarah Wilson',
      email: 'mentor@demo.com',
      gitlabId: '999999',
      gitlabUsername: 'demo_mentor',
      role: 'mentor',
      avatarUrl: 'https://via.placeholder.com/150',
      isDemo: true,
      onboardingComplete: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    // Create demo colleges
    const demoColleges = [
      {
        _id: 'demo_college_1',
        name: 'Sreenidhi Institute of Science and Technology',
        description: 'Premier engineering college in Hyderabad',
        location: 'Hyderabad, Telangana',
        website: 'https://sreenidhi.edu.in',
        createdBy: 'demo_mentor_1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      },
      {
        _id: 'demo_college_2',
        name: 'JNTUH College of Engineering',
        description: 'Autonomous engineering college under JNTUH',
        location: 'Hyderabad, Telangana',
        website: 'https://jntuhceh.ac.in',
        createdBy: 'demo_mentor_1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      }
    ];

    // Create demo cohorts
    const demoCohorts = [
      {
        _id: 'demo_cohort_1',
        name: 'Summer 2025 Batch',
        description: 'Summer internship program for 2025',
        collegeId: 'demo_college_1',
        createdBy: 'demo_mentor_1',
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-07-31'),
        maxInterns: 20,
        currentInterns: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      },
      {
        _id: 'demo_cohort_2',
        name: 'Full Stack Development Cohort',
        description: 'Specialized cohort for full-stack development',
        collegeId: 'demo_college_2',
        createdBy: 'demo_mentor_1',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-06-15'),
        maxInterns: 25,
        currentInterns: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      }
    ];

    if (isDemoMode()) {
      // Reset demo data
      demoData = {
        users: [demoMentor],
        colleges: demoColleges,
        cohorts: demoCohorts,
        joinRequests: []
      };
      console.log('✅ Demo data seeded in memory');
    } else {
      // Seed to MongoDB
      const db = await getDatabase();
      
      // Check if demo data already exists
      const existingCollege = await db.collection('colleges').findOne({ name: 'Sreenidhi Institute of Science and Technology' });
      if (existingCollege) {
        console.log('Demo data already exists');
        return;
      }

      await db.collection('users').insertOne(demoMentor);
      await db.collection('colleges').insertMany(demoColleges);
      await db.collection('cohorts').insertMany(demoCohorts);
      
      console.log('✅ Demo data seeded to MongoDB');
    }
  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  }
}

// GitLab API helpers
export async function getGitLabUserInfo(accessToken) {
  try {
    const response = await fetch('https://gitlab.com/api/v4/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch GitLab user info');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching GitLab user info:', error);
    throw error;
  }
}

export async function getGitLabUserProjects(accessToken, userId) {
  try {
    const response = await fetch(`https://gitlab.com/api/v4/users/${userId}/projects`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch GitLab projects');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching GitLab projects:', error);
    throw error;
  }
}

export async function getGitLabUserCommits(accessToken, projectId, since = null) {
  try {
    let url = `https://gitlab.com/api/v4/projects/${projectId}/repository/commits`;
    if (since) {
      url += `?since=${since}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch GitLab commits');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching GitLab commits:', error);
    throw error;
  }
}