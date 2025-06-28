import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import College from '../../../../models/College';
import User from '../../../../models/User';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assignments } = await request.json();
    
    if (!assignments || !Array.isArray(assignments)) {
      return NextResponse.json({ error: 'Invalid assignments data' }, { status: 400 });
    }

    await connectToDatabase();

    const results = [];
    
    for (const assignment of assignments) {
      const { userId, collegeId } = assignment;
      
      try {
        // Validate user exists
        const user = await User.findById(userId);
        if (!user) {
          results.push({ userId, status: 'error', message: 'User not found' });
          continue;
        }

        // Validate college exists
        const college = await College.findById(collegeId);
        if (!college) {
          results.push({ userId, status: 'error', message: 'College not found' });
          continue;
        }

        // Update user's college
        await User.findByIdAndUpdate(userId, { college: collegeId });
        
        results.push({ 
          userId, 
          status: 'success', 
          message: `Assigned ${user.name} to ${college.name}` 
        });
        
      } catch (error) {
        results.push({ 
          userId, 
          status: 'error', 
          message: error.message 
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'College assignment process completed',
      results
    });

  } catch (error) {
    console.error('Error fixing college assignments:', error);
    return NextResponse.json({ 
      error: 'Failed to fix college assignments',
      details: error.message
    }, { status: 500 });
  }
}

// GET endpoint to suggest automatic assignments
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get users without colleges
    const usersWithoutColleges = await User.find({
      college: { $exists: false },
      role: { $in: ['intern', 'mentor', 'super-mentor'] },
      isActive: true
    }).select('_id name gitlabUsername role');

    // Get all colleges
    const colleges = await College.find({ isActive: true }).select('_id name');

    // Suggest assignments based on naming patterns or other logic
    const suggestions = usersWithoutColleges.map(user => {
      // Simple suggestion: assign to first college (can be improved with better logic)
      const suggestedCollege = colleges.length > 0 ? colleges[0] : null;
      
      return {
        userId: user._id,
        userName: user.name,
        userRole: user.role,
        gitlabUsername: user.gitlabUsername,
        suggestedCollegeId: suggestedCollege?._id,
        suggestedCollegeName: suggestedCollege?.name
      };
    });

    return NextResponse.json({
      usersWithoutColleges: usersWithoutColleges.length,
      availableColleges: colleges,
      suggestions
    });

  } catch (error) {
    console.error('Error getting college assignment suggestions:', error);
    return NextResponse.json({ 
      error: 'Failed to get suggestions',
      details: error.message
    }, { status: 500 });
  }
}