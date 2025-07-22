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
      .select('name description location website superTech LeadUsername createdAt')
      .sort({ name: 1 });

    // Get super-mentor names and intern counts for each college
    const collegesWithPOCs = await Promise.all(
      colleges.map(async (college) => {
        let superTech LeadName = 'N/A';
        if (college.superTech LeadUsername) {
          const superTech Lead = await User.findOne({ 
            gitlabUsername: college.superTech LeadUsername,
            role: 'POC',
            isActive: true 
          });
          if (superTech Lead) {
            superTech LeadName = superTech Lead.name;
          }
        }
        
        // Get intern counts for this college
        const totalAIDeveloperInterns = await User.countDocuments({
          college: college._id,
          role: 'AI Developer Intern'
        });
        
        const activeAIDeveloperInterns = await User.countDocuments({
          college: college._id,
          role: 'AI Developer Intern',
          isActive: true
        });
        
        const internsWithCohorts = await User.countDocuments({
          college: college._id,
          role: 'AI Developer Intern',
          cohortId: { $ne: null }
        });
        
        return {
          _id: college._id,
          name: college.name,
          description: college.description,
          location: college.location,
          website: college.website,
          superTech LeadUsername: college.superTech LeadUsername,
          superTech LeadName,
          totalAIDeveloperInterns,
          activeAIDeveloperInterns,
          internsWithCohorts,
          createdAt: college.createdAt
        };
      })
    );

    return NextResponse.json({ colleges: collegesWithPOCs });

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

    const { name, description, location, website, superTech LeadUsername } = await request.json();

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

    // Validate super-mentor if provided
    if (superTech LeadUsername) {
      const superTech Lead = await User.findOne({ 
        gitlabUsername: superTech LeadUsername.toLowerCase(),
        role: 'POC',
        isActive: true 
      });
      
      if (!superTech Lead) {
        return NextResponse.json({ error: 'Super-mentor not found' }, { status: 400 });
      }
    }

    // Create new college
    const newCollege = new College({
      name,
      description,
      location,
      website: website || '',
      superTech LeadUsername: superTech LeadUsername ? superTech LeadUsername.toLowerCase() : '',
      isActive: true,
      createdBy: session.user.gitlabUsername || session.user.email || 'admin'
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