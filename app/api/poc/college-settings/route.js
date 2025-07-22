import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../lib/mongoose';
import User from '../../../../models/User';
import College from '../../../../models/College';

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'POC') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, location, email, phone, website } = await request.json();

    if (!name) {
      return NextResponse.json({ 
        error: 'College name is required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Get POC's college
    const poc = await User.findById(session.user.id).populate('college');
    if (!poc || !poc.college) {
      return NextResponse.json({ error: 'POC college not found' }, { status: 404 });
    }

    // Update college information
    const updatedCollege = await College.findByIdAndUpdate(
      poc.college._id,
      {
        name,
        location,
        email,
        phone,
        website,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedCollege) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'College settings updated successfully',
      college: updatedCollege 
    });

  } catch (error) {
    console.error('Error updating college settings:', error);
    return NextResponse.json({ 
      error: 'Failed to update college settings',
      details: error.message 
    }, { status: 500 });
  }
}