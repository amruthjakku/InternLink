import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'pending') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, college, assignedBy, gitlabUsername, gitlabId, name, email } = await request.json();

    if (!role || !assignedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if ((role === 'intern' || role === 'mentor') && !college) {
      return NextResponse.json({ error: 'College is required for interns and mentors' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findByGitLabUsername(gitlabUsername);
    if (existingUser) {
      return NextResponse.json({ error: 'User already registered' }, { status: 400 });
    }

    // Create new user
    const userData = {
      gitlabUsername: gitlabUsername.toLowerCase(),
      gitlabId,
      name,
      email: email.toLowerCase(),
      role,
      assignedBy,
      isActive: true,
      lastLoginAt: new Date()
    };

    // Add college if required
    if (college && (role === 'intern' || role === 'mentor')) {
      userData.college = college;
    }

    const newUser = new User(userData);
    await newUser.save();

    console.log(`New user registered: ${gitlabUsername} (${role})`);

    return NextResponse.json({ 
      success: true, 
      message: 'Registration completed successfully',
      user: {
        id: newUser._id,
        role: newUser.role,
        gitlabUsername: newUser.gitlabUsername
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ 
      error: 'Registration failed' 
    }, { status: 500 });
  }
}