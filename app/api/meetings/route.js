import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../utils/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // For now, return empty meetings array
    // In a real implementation, you would fetch from a meetings collection
    const meetings = [];

    return NextResponse.json({ meetings });

  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch meetings' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'mentor' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, date, startTime, endTime, type, attendees, meetingLink } = await request.json();

    if (!title || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Title, date, start time, and end time are required' }, { status: 400 });
    }

    await connectToDatabase();

    const meetingData = {
      title,
      description: description || '',
      date,
      startTime,
      endTime,
      type: type || 'general',
      attendees: attendees || [],
      mentorId: session.user.id,
      meetingLink: meetingLink || '',
      status: 'scheduled',
      createdAt: new Date()
    };

    // In a real implementation, save to meetings collection
    // const db = await getDatabase();
    // const result = await db.collection('meetings').insertOne(meetingData);

    return NextResponse.json({ 
      success: true, 
      message: 'Meeting created successfully' 
    });

  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json({ 
      error: 'Failed to create meeting' 
    }, { status: 500 });
  }
}