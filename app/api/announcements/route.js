import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../lib/mongoose';
import Announcement from '../../../models/Announcement';
import User from '../../../models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = parseInt(searchParams.get('skip')) || 0;
    const includeRead = searchParams.get('includeRead') !== 'false';

    // Get user details
    const user = await User.findOne({
      $or: [
        { gitlabUsername: session.user.gitlabUsername },
        { email: session.user.email }
      ]
    }).populate('college');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get announcements for this user
    const announcements = await Announcement.getForUser(
      user._id,
      user.role,
      user.college?._id,
      { limit, skip, includeRead }
    );

    // Add read status for each announcement
    const announcementsWithReadStatus = announcements.map(announcement => ({
      ...announcement.toObject(),
      isRead: announcement.isReadBy(user._id),
      isExpired: announcement.isExpired
    }));

    return NextResponse.json({ 
      announcements: announcementsWithReadStatus,
      total: announcementsWithReadStatus.length,
      hasMore: announcementsWithReadStatus.length === limit
    });

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
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only POCs and admins can create announcements
    if (!['POC', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ 
        error: 'Unauthorized - Only POCs and admins can create announcements' 
      }, { status: 403 });
    }

    await connectToDatabase();

    const { 
      title, 
      message, 
      priority, 
      targetAudience, 
      scope,
      college,
      expiresAt,
      tags 
    } = await request.json();

    if (!title || !message) {
      return NextResponse.json({ 
        error: 'Title and message are required' 
      }, { status: 400 });
    }

    // Get user details
    const user = await User.findOne({
      $or: [
        { gitlabUsername: session.user.gitlabUsername },
        { email: session.user.email }
      ]
    }).populate('college');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine scope and college
    let announcementScope = scope || 'college';
    let announcementCollege = null;

    if (session.user.role === 'POC') {
      // POCs can only create college-scoped announcements for their college
      announcementScope = 'college';
      announcementCollege = user.college?._id;
      
      if (!announcementCollege) {
        return NextResponse.json({ 
          error: 'POC must be assigned to a college' 
        }, { status: 400 });
      }
    } else if (session.user.role === 'admin') {
      // Admins can create global or college-specific announcements
      if (announcementScope === 'college') {
        announcementCollege = college || user.college?._id;
        if (!announcementCollege) {
          return NextResponse.json({ 
            error: 'College is required for college-scoped announcements' 
          }, { status: 400 });
        }
      }
    }

    // Create announcement
    const announcement = new Announcement({
      title: title.trim(),
      message: message.trim(),
      priority: priority || 'normal',
      targetAudience: targetAudience || 'all',
      scope: announcementScope,
      college: announcementCollege,
      createdBy: user._id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      tags: tags || []
    });

    await announcement.save();

    // Populate the created announcement
    await announcement.populate('createdBy', 'name email role');
    await announcement.populate('college', 'name');

    return NextResponse.json({ 
      message: 'Announcement created successfully',
      announcement: {
        ...announcement.toObject(),
        isRead: false,
        isExpired: announcement.isExpired
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ 
      error: 'Failed to create announcement',
      details: error.message 
    }, { status: 500 });
  }
}