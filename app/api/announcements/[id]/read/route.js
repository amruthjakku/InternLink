import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../lib/mongoose';
import Announcement from '../../../../../models/Announcement';
import User from '../../../../../models/User';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = params;

    // Get user details
    const user = await User.findOne({
      $or: [
        { gitlabUsername: session.user.gitlabUsername },
        { email: session.user.email }
      ]
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the announcement
    const announcement = await Announcement.findById(id);
    
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Mark as read
    announcement.markAsReadBy(user._id);
    await announcement.save();

    return NextResponse.json({ 
      message: 'Announcement marked as read',
      isRead: true
    });

  } catch (error) {
    console.error('Error marking announcement as read:', error);
    return NextResponse.json({ 
      error: 'Failed to mark announcement as read',
      details: error.message 
    }, { status: 500 });
  }
}