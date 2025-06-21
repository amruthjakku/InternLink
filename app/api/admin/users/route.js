import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import User from '../../../../models/User.js';
import College from '../../../../models/College.js';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const users = await User.find({ isActive: true })
      .populate('college')
      .sort({ createdAt: -1 });

    return NextResponse.json(users);

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

    await connectToDatabase();

    const { gitlabUsername, name, email, role, college } = await request.json();

    // Validate required fields
    if (!gitlabUsername || !name || !email || !role) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      gitlabUsername: gitlabUsername.toLowerCase() 
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this GitLab username already exists' 
      }, { status: 400 });
    }

    // Validate college for intern role (mentors can be created without college)
    if (role === 'intern' && !college) {
      return NextResponse.json({ 
        error: 'College is required for intern role' 
      }, { status: 400 });
    }

    // If adding a mentor, check if college already has a mentor
    if (role === 'mentor' && college) {
      const existingMentor = await User.findOne({ 
        role: 'mentor', 
        college: college, 
        isActive: true 
      });

      if (existingMentor) {
        return NextResponse.json({ 
          error: 'This college already has a mentor assigned' 
        }, { status: 400 });
      }

      // Update college with mentor username
      await College.findByIdAndUpdate(college, {
        mentorUsername: gitlabUsername.toLowerCase()
      });
    }

    // Create new user
    const newUser = new User({
      gitlabUsername: gitlabUsername.toLowerCase(),
      gitlabId: `pending_${gitlabUsername.toLowerCase()}`, // Will be updated on first login
      name,
      email: email.toLowerCase(),
      role,
      college: (role === 'intern' || (role === 'mentor' && college)) ? college : undefined,
      assignedBy: session.user.gitlabUsername,
      isActive: true
    });

    await newUser.save();

    // Populate college info for response
    await newUser.populate('college');

    return NextResponse.json(newUser, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
      error: 'Failed to create user' 
    }, { status: 500 });
  }
}