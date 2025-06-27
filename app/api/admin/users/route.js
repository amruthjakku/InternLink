import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import College from '../../../../models/College';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const cohortId = url.searchParams.get('cohortId');
    
    console.log(`GET /api/admin/users - Query parameters:`, { role, cohortId });

    await connectToDatabase();

    // Build query
    const query = { isActive: true };
    if (role) {
      query.role = role;
      console.log(`Filtering users by role: ${role}`);
    }
    if (cohortId) {
      if (cohortId === 'none') {
        query.cohortId = null;
      } else {
        query.cohortId = cohortId;
      }
      console.log(`Filtering users by cohortId: ${cohortId}`);
    }

    const users = await User.find(query)
      .populate('college', 'name')
      .select('gitlabUsername name email role college cohortId isActive createdAt lastLoginAt')
      .sort({ createdAt: -1 });

    // Format users for frontend with calculated metrics
    const formattedUsers = users.map(user => {
      // Calculate performance score based on various factors
      const daysSinceCreated = Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));
      const daysSinceLastLogin = user.lastLoginAt ? 
        Math.floor((new Date() - new Date(user.lastLoginAt)) / (1000 * 60 * 60 * 24)) : 999;
      
      // Performance score calculation (0-100)
      let performanceScore = 75; // Base score
      if (daysSinceLastLogin <= 1) performanceScore += 20;
      else if (daysSinceLastLogin <= 7) performanceScore += 10;
      else if (daysSinceLastLogin <= 30) performanceScore -= 10;
      else performanceScore -= 25;
      
      performanceScore = Math.max(0, Math.min(100, performanceScore));
      
      // Activity level based on last login
      let activityLevel = 'low';
      if (daysSinceLastLogin <= 1) activityLevel = 'high';
      else if (daysSinceLastLogin <= 7) activityLevel = 'medium';
      
      // Risk level based on activity and account age
      let riskLevel = 'low';
      if (daysSinceLastLogin > 30) riskLevel = 'high';
      else if (daysSinceLastLogin > 14) riskLevel = 'medium';
      
      // Log the user ID for debugging
      console.log(`Processing user: ${user.name}, ID: ${user._id}, Role: ${user.role}`);
      
      return {
        id: user._id?.toString() || `temp-${Date.now()}-${Math.random()}`,
        _id: user._id?.toString() || `temp-${Date.now()}-${Math.random()}`, // Ensure _id is a string
        gitlabUsername: user.gitlabUsername,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college?.name || 'N/A',
        cohortId: user.cohortId?.toString() || null,
        status: user.isActive ? 'active' : 'inactive',
        performanceScore: performanceScore,
        activityLevel: activityLevel,
        riskLevel: riskLevel,
        lastActive: user.lastLoginAt || user.createdAt,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        joinDate: user.createdAt
      };
    });

    return NextResponse.json({ users: formattedUsers });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestBody = await request.json();
    console.log('POST /api/admin/users - Request body:', requestBody);
    
    const { gitlabUsername, name, email, role, college, assignedBy, assignedMentor, cohort, autoDetected } = requestBody;

    if (!gitlabUsername) {
      return NextResponse.json({ error: 'GitLab username is required' }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    if ((role === 'intern' || role === 'mentor' || role === 'super-mentor') && !college) {
      return NextResponse.json({ error: 'College is required for interns, mentors, and super-mentors' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if user already exists by GitLab username
    const existingUser = await User.findOne({ 
      gitlabUsername: gitlabUsername.toLowerCase()
    });

    if (existingUser) {
      return NextResponse.json({ error: 'GitLab username already exists' }, { status: 400 });
    }

    // Check email if provided
    if (email) {
      const existingEmailUser = await User.findOne({ 
        email: email.toLowerCase()
      });
      
      if (existingEmailUser) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
      }
    }

    // Find college ObjectId if college is provided
    let collegeId = null;
    if (college && (role === 'intern' || role === 'mentor' || role === 'super-mentor')) {
      const collegeDoc = await College.findOne({ 
        name: college.trim(),
        isActive: true 
      });
      
      if (!collegeDoc) {
        return NextResponse.json({ 
          error: `College "${college}" not found. Please make sure the college exists.` 
        }, { status: 400 });
      }
      
      collegeId = collegeDoc._id;
    }

    // Create new user
    const userData = {
      gitlabUsername: gitlabUsername.toLowerCase(),
      gitlabId: `manual_${Date.now()}`,
      name: name || gitlabUsername, // Use username as fallback for name
      role,
      assignedBy: assignedBy || session.user.name || session.user.email,
      isActive: true
    };

    // Add email only if provided
    if (email) {
      userData.email = email.toLowerCase();
    }

    // Add auto-detection metadata if available
    if (autoDetected) {
      userData.autoDetected = autoDetected;
    }

    if (collegeId) {
      userData.college = collegeId;
    }

    // Add assignedMentor for interns (optional)
    if (role === 'intern' && assignedMentor) {
      userData.assignedMentor = assignedMentor;
    }

    // Add cohort assignment for interns (optional)
    if (role === 'intern' && cohort) {
      userData.cohortId = cohort;
    }

    console.log('🔍 User Creation Debug - About to create user with data:', {
      gitlabUsername: userData.gitlabUsername,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      hasCollege: !!userData.college,
      collegeId: userData.college?.toString(),
      isActive: userData.isActive,
      assignedBy: userData.assignedBy
    });

    const newUser = new User(userData);
    await newUser.save();
    
    console.log('🔍 User Creation Debug - User saved successfully:', {
      id: newUser._id.toString(),
      gitlabUsername: newUser.gitlabUsername,
      role: newUser.role,
      isActive: newUser.isActive
    });

    // Verify the user was saved correctly by fetching it back
    const verifyUser = await User.findByGitLabUsername(newUser.gitlabUsername);
    console.log('🔍 User Creation Debug - Verification lookup:', {
      found: !!verifyUser,
      role: verifyUser?.role,
      isActive: verifyUser?.isActive,
      id: verifyUser?._id?.toString()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully',
      userId: newUser._id.toString(),
      user: {
        _id: newUser._id,
        gitlabUsername: newUser.gitlabUsername,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        cohortId: newUser.cohortId
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: `Failed to create user: ${error.message}` 
    }, { status: 500 });
  }
}