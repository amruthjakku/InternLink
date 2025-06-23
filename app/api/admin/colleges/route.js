import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import College from '../../../../models/College';
import User from '../../../../models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const colleges = await College.find({ isActive: true })
      .select('name description location website mentorUsername createdAt')
      .sort({ name: 1 });

    // Get mentor names for each college
    const collegesWithMentors = await Promise.all(
      colleges.map(async (college) => {
        let mentorName = 'N/A';
        if (college.mentorUsername) {
          const mentor = await User.findOne({ 
            gitlabUsername: college.mentorUsername,
            role: 'mentor',
            isActive: true 
          });
          if (mentor) {
            mentorName = mentor.name;
          }
        }
        
        return {
          _id: college._id,
          name: college.name,
          description: college.description,
          location: college.location,
          website: college.website,
          mentorUsername: college.mentorUsername,
          mentorName,
          createdAt: college.createdAt
        };
      })
    );

    return NextResponse.json({ colleges: collegesWithMentors });

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
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, location, website, mentorUsername } = await request.json();

    if (!name || !description || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if college already exists
    const existingCollege = await College.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingCollege) {
      return NextResponse.json({ error: 'College already exists' }, { status: 400 });
    }

    // Validate mentor if provided
    if (mentorUsername) {
      const mentor = await User.findOne({ 
        gitlabUsername: mentorUsername.toLowerCase(),
        role: 'mentor',
        isActive: true 
      });
      
      if (!mentor) {
        return NextResponse.json({ error: 'Mentor not found' }, { status: 400 });
      }
    }

    // Create new college
    const newCollege = new College({
      name,
      description,
      location,
      website: website || '',
      mentorUsername: mentorUsername ? mentorUsername.toLowerCase() : '',
      isActive: true
    });

    await newCollege.save();

    return NextResponse.json({ 
      success: true, 
      message: 'College created successfully',
      college: {
        _id: newCollege._id,
        name: newCollege.name,
        description: newCollege.description,
        location: newCollege.location
      }
    });

  } catch (error) {
    console.error('Error creating college:', error);
    return NextResponse.json({ 
      error: 'Failed to create college' 
    }, { status: 500 });
  }
}