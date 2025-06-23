import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'super-mentor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gitlabUsername, name, email, role, college, assignedBy, specialization } = await request.json();

    if (!gitlabUsername || !name || !email || !role || !assignedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (role !== 'mentor') {
      return NextResponse.json({ error: 'Can only create mentor accounts' }, { status: 400 });
    }

    await connectToDatabase();

    // Verify super-mentor can manage this college
    const superMentor = await User.findById(session.user.id);
    if (!superMentor || superMentor.college.toString() !== college) {
      return NextResponse.json({ error: 'Cannot create mentor for different college' }, { status: 403 });
    }

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

    // Create new mentor
    const userData = {
      gitlabUsername: gitlabUsername.toLowerCase(),
      gitlabId: `manual_${Date.now()}`, // Temporary ID for manually created users
      name,
      email: email.toLowerCase(),
      role,
      college,
      assignedBy,
      isActive: true
    };

    const newMentor = new User(userData);
    await newMentor.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Mentor created successfully',
      mentor: {
        _id: newMentor._id,
        gitlabUsername: newMentor.gitlabUsername,
        name: newMentor.name,
        email: newMentor.email,
        role: newMentor.role
      }
    });

  } catch (error) {
    console.error('Error creating mentor:', error);
    return NextResponse.json({ 
      error: 'Failed to create mentor' 
    }, { status: 500 });
  }
}