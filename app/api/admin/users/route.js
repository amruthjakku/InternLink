import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';

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

    // Format users for frontend
    const formattedUsers = users.map(user => ({
      _id: user._id,
      gitlabUsername: user.gitlabUsername,
      name: user.name,
      email: user.email,
      role: user.role,
      college: user.college?.name || 'N/A',
      status: user.isActive ? 'active' : 'inactive',
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    }));

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

    const { gitlabUsername, name, email, role, college, assignedBy } = await request.json();

    if (!gitlabUsername || !name || !email || !role || !assignedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if ((role === 'intern' || role === 'mentor') && !college) {
      return NextResponse.json({ error: 'College is required for interns and mentors' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { gitlabUsername: gitlabUsername.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Create new user
    const userData = {
      gitlabUsername: gitlabUsername.toLowerCase(),
      gitlabId: `manual_${Date.now()}`, // Temporary ID for manually created users
      name,
      email: email.toLowerCase(),
      role,
      assignedBy,
      isActive: true
    };

    if (college && (role === 'intern' || role === 'mentor')) {
      userData.college = college;
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
    return NextResponse.json({ 
      error: 'Failed to create user' 
    }, { status: 500 });
  }
}