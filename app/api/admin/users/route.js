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

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const cohortId = searchParams.get('cohortId');

    await connectToDatabase();

    const query = {};
    if (role) query.role = role;
    if (cohortId) {
      query.cohortId = cohortId === 'none' ? null : cohortId;
    }

    const users = await User.find(query)
      .populate('college', 'name')
      .select('-password') // Exclude sensitive fields
      .sort({ createdAt: -1 })
      .lean();

    const formattedUsers = users.map(user => ({
      ...user,
      id: user._id.toString(),
      _id: user._id.toString(),
      college: user.college?.name || 'N/A',
      status: user.isActive ? 'active' : 'inactive',
      joinDate: user.createdAt, // Keep for backward compatibility if needed
    }));

    return NextResponse.json({ users: formattedUsers });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { gitlabUsername, name, email, role, college, cohortId } = body;

    if (!gitlabUsername || !role) {
      return NextResponse.json({ error: 'GitLab username and role are required' }, { status: 400 });
    }

    await connectToDatabase();

    if (await User.findOne({ gitlabUsername: gitlabUsername.toLowerCase() })) {
      return NextResponse.json({ error: 'GitLab username already exists' }, { status: 409 });
    }

    if (email && await User.findOne({ email: email.toLowerCase() })) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    let collegeRef = null;
    if (college) {
      collegeRef = await College.findOne({ name: college.trim() });
      if (!collegeRef) {
        return NextResponse.json({ error: `College '${college}' not found` }, { status: 400 });
      }
    }

    const newUser = await User.create({
      ...body,
      gitlabUsername: gitlabUsername.toLowerCase(),
      name: name || gitlabUsername,
      email: email ? email.toLowerCase() : null,
      college: collegeRef?._id,
      cohortId: cohortId,
      assignedBy: session.user.id,
    });

    return NextResponse.json(newUser, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
