import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import College from '../../../../models/College';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const users = await User.find({ isActive: true })
      .populate('college', 'name')
      .select('gitlabUsername name email role college isActive createdAt lastLoginAt')
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
      
      return {
        id: user._id.toString(),
        _id: user._id,
        gitlabUsername: user.gitlabUsername,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college?.name || 'N/A',
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
    
    const { gitlabUsername, name, email, role, college, assignedBy } = requestBody;

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 });
    }

    if (!gitlabUsername) {
      return NextResponse.json({ error: 'GitLab username is required' }, { status: 400 });
    }

    if ((role === 'intern' || role === 'mentor' || role === 'super-mentor') && !college) {
      return NextResponse.json({ error: 'College is required for interns, mentors, and super-mentors' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { gitlabUsername: gitlabUsername.toLowerCase() }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
      }
      if (existingUser.gitlabUsername === gitlabUsername.toLowerCase()) {
        return NextResponse.json({ error: 'GitLab username already exists' }, { status: 400 });
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
      gitlabId: `manual_${Date.now()}`, // Temporary ID for manually created users
      name,
      email: email.toLowerCase(),
      role,
      assignedBy: assignedBy || session.user.name || session.user.email,
      isActive: true
    };

    if (collegeId) {
      userData.college = collegeId;
    }

    const newUser = new User(userData);
    await newUser.save();

    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully',
      user: {
        _id: newUser._id,
        gitlabUsername: newUser.gitlabUsername,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
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