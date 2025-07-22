import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../lib/mongoose';
import Announcement from '../../../../models/Announcement';
import User from '../../../../models/User';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = params;

    // Find the announcement
    const announcement = await Announcement.findById(id)
      .populate('createdBy', 'name email role')
      .populate('college', 'name');
    
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Get user details to check read status
    const user = await User.findOne({
      $or: [
        { gitlabUsername: session.user.gitlabUsername },
        { email: session.user.email }
      ]
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      announcement: {
        ...announcement.toObject(),
        isRead: announcement.isReadBy(user._id),
        isExpired: announcement.isExpired
      }
    });

  } catch (error) {
    console.error('Error fetching announcement:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch announcement',
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only POCs and admins can update announcements
    if (!['POC', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ 
        error: 'Unauthorized - Only POCs and admins can update announcements' 
      }, { status: 403 });
    }

    await connectToDatabase();

    const { id } = params;
    const updateData = await request.json();

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

    // Find the announcement
    const announcement = await Announcement.findById(id);
    
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Check permissions
    if (session.user.role === 'POC') {
      // POCs can only update their own college announcements
      if (announcement.scope === 'global' || 
          (announcement.scope === 'college' && announcement.college?.toString() !== user.college?._id?.toString())) {
        return NextResponse.json({ 
          error: 'Unauthorized - POCs can only update their college announcements' 
        }, { status: 403 });
      }
    }

    // Update the announcement
    const allowedFields = ['title', 'message', 'priority', 'targetAudience', 'isActive', 'expiresAt', 'tags'];
    const updateFields = {};
    
    allowedFields.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        updateFields[field] = updateData[field];
      }
    });

    // Trim string fields
    if (updateFields.title) updateFields.title = updateFields.title.trim();
    if (updateFields.message) updateFields.message = updateFields.message.trim();

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'name email role')
    .populate('college', 'name');

    return NextResponse.json({ 
      message: 'Announcement updated successfully',
      announcement: {
        ...updatedAnnouncement.toObject(),
        isRead: updatedAnnouncement.isReadBy(user._id),
        isExpired: updatedAnnouncement.isExpired
      }
    });

  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ 
      error: 'Failed to update announcement',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only POCs and admins can delete announcements
    if (!['POC', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ 
        error: 'Unauthorized - Only POCs and admins can delete announcements' 
      }, { status: 403 });
    }

    await connectToDatabase();

    const { id } = params;

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

    // Find the announcement
    const announcement = await Announcement.findById(id);
    
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Check permissions
    if (session.user.role === 'POC') {
      // POCs can only delete their own college announcements
      if (announcement.scope === 'global' || 
          (announcement.scope === 'college' && announcement.college?.toString() !== user.college?._id?.toString())) {
        return NextResponse.json({ 
          error: 'Unauthorized - POCs can only delete their college announcements' 
        }, { status: 403 });
      }
    }

    // Delete the announcement
    await Announcement.findByIdAndDelete(id);

    return NextResponse.json({ 
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ 
      error: 'Failed to delete announcement',
      details: error.message 
    }, { status: 500 });
  }
}