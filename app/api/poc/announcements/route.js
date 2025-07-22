import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../lib/mongoose';
import User from '../../../../models/User';
import mongoose from 'mongoose';

// Announcement Schema
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  targetAudience: { type: String, enum: ['all', 'interns', 'mentors'], default: 'all' },
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'POC') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get POC's college
    const poc = await User.findById(session.user.id).populate('college');
    if (!poc || !poc.college) {
      return NextResponse.json({ error: 'POC college not found' }, { status: 404 });
    }

    // Get announcements for this college
    const announcements = await Announcement.find({
      college: poc.college._id,
      isActive: true
    })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
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
    const poc = await User.findById(session.user.id).populate('college');
    if (!poc || !poc.college) {
      return NextResponse.json({ error: 'POC college not found' }, { status: 404 });
    }

    // Create new announcement
    const announcement = new Announcement({
      title,
      message,
      priority: priority || 'normal',
      targetAudience: targetAudience || 'all',
      college: poc.college._id,
      createdBy: session.user.id
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