import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../lib/mongoose';
import User from '../../../../models/User';
import Announcement from '../../../../models/Announcement';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'POC') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get POC's college
    const poc = await User.findOne({
      $or: [
        { gitlabUsername: session.user.gitlabUsername },
        { email: session.user.email }
      ]
    }).populate('college');
    
    if (!poc || !poc.college) {
      return NextResponse.json({ error: 'POC college not found' }, { status: 404 });
    }

    // Get announcements for this college
    const announcements = await Announcement.find({
      $or: [
        { scope: 'global' },
        { scope: 'college', college: poc.college._id }
      ],
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    })
    .populate('createdBy', 'name email role')
    .populate('college', 'name')
    .sort({ priority: -1, createdAt: -1 })
    .limit(20);

    return NextResponse.json({ announcements });

  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch announcements',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'POC') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, message, priority, targetAudience, college } = await request.json();

    if (!title || !message) {
      return NextResponse.json({ 
        error: 'Title and message are required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Get POC's college
    const poc = await User.findOne({
      $or: [
        { gitlabUsername: session.user.gitlabUsername },
        { email: session.user.email }
      ]
    }).populate('college');
    
    if (!poc || !poc.college) {
      return NextResponse.json({ error: 'POC college not found' }, { status: 404 });
    }

    // Create new announcement
    const announcement = new Announcement({
      title: title.trim(),
      message: message.trim(),
      priority: priority || 'normal',
      targetAudience: targetAudience || 'all',
      scope: 'college',
      college: poc.college._id,
      createdBy: poc._id
    });

    await announcement.save();

    // Populate the created announcement
    await announcement.populate('createdBy', 'name email');

    return NextResponse.json({ 
      message: 'Announcement created successfully',
      announcement 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ 
      error: 'Failed to create announcement',
      details: error.message 
    }, { status: 500 });
  }
}