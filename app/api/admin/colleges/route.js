import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import College from '../../../../models/College.js';
import User from '../../../../models/User.js';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const colleges = await College.find({ isActive: true })
      .populate('mentor')
      .sort({ createdAt: -1 });

    // Add intern count to each college
    const collegesWithStats = await Promise.all(
      colleges.map(async (college) => {
        const internsCount = await User.countDocuments({
          college: college._id,
          role: 'intern',
          isActive: true
        });

        return {
          ...college.toJSON(),
          internsCount
        };
      })
    );

    return NextResponse.json(collegesWithStats);

  } catch (error) {
    console.error('Error fetching colleges:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch colleges' 
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

    const { name, description, location, website, mentorUsername } = await request.json();

    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        error: 'College name is required' 
      }, { status: 400 });
    }

    // Check if college already exists
    const existingCollege = await College.findOne({ 
      name: name.trim(),
      isActive: true 
    });

    if (existingCollege) {
      return NextResponse.json({ 
        error: 'College with this name already exists' 
      }, { status: 400 });
    }

    let mentor = null;
    
    // If mentor username is provided, validate it
    if (mentorUsername && mentorUsername.trim()) {
      // Check if mentor exists and is available
      mentor = await User.findOne({ 
        gitlabUsername: mentorUsername.toLowerCase(),
        role: 'mentor',
        isActive: true 
      });

      if (!mentor) {
        return NextResponse.json({ 
          error: 'Mentor not found or not available' 
        }, { status: 400 });
      }

      // Check if mentor is already assigned to another college
      const existingAssignment = await College.findOne({ 
        mentorUsername: mentorUsername.toLowerCase(),
        isActive: true 
      });

      if (existingAssignment) {
        return NextResponse.json({ 
          error: 'This mentor is already assigned to another college' 
        }, { status: 400 });
      }
    }

    // Create new college
    const newCollege = new College({
      name: name.trim(),
      description: description?.trim() || '',
      location: location?.trim() || '',
      website: website?.trim() || '',
      mentorUsername: mentorUsername ? mentorUsername.toLowerCase() : 'unassigned',
      createdBy: session.user.gitlabUsername,
      isActive: true
    });

    await newCollege.save();

    // Update mentor's college assignment if mentor exists
    if (mentor) {
      mentor.college = newCollege._id;
      await mentor.save();
    }

    // Populate mentor info for response
    await newCollege.populate('mentor');

    return NextResponse.json(newCollege, { status: 201 });

  } catch (error) {
    console.error('Error creating college:', error);
    return NextResponse.json({ 
      error: 'Failed to create college' 
    }, { status: 500 });
  }
}