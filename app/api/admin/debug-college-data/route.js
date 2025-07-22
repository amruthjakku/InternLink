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

    // Get raw data for debugging
    const colleges = await College.find({}).select('name _id');
    const users = await User.find({}).populate('college', 'name').select('name role college isActive');

    // Debug information
    const debug = {
      totalColleges: colleges.length,
      totalUsers: users.length,
      usersByRole: {
        intern: users.filter(u => u.role === 'AI Developer Intern').length,
        mentor: users.filter(u => u.role === 'Tech Lead').length,
        'POC': users.filter(u => u.role === 'POC').length,
        admin: users.filter(u => u.role === 'admin').length
      },
      usersWithColleges: users.filter(u => u.college).length,
      usersWithoutColleges: users.filter(u => !u.college).length,
      
      // Detailed college breakdown
      collegeBreakdown: colleges.map(college => {
        const collegeUsers = users.filter(u => 
          u.college && u.college._id && 
          u.college._id.toString() === college._id.toString()
        );
        
        return {
          collegeName: college.name,
          collegeId: college._id.toString(),
          totalUsers: collegeUsers.length,
          interns: collegeUsers.filter(u => u.role === 'AI Developer Intern').length,
          mentors: collegeUsers.filter(u => u.role === 'Tech Lead').length,
          superTech Leads: collegeUsers.filter(u => u.role === 'POC').length,
          userDetails: collegeUsers.map(u => ({
            name: u.name,
            role: u.role,
            isActive: u.isActive,
            collegeRef: u.college ? u.college.name : 'No college'
          }))
        };
      }),
      
      // Sample users without colleges
      usersWithoutCollegesSample: users.filter(u => !u.college).slice(0, 5).map(u => ({
        name: u.name,
        role: u.role,
        isActive: u.isActive
      })),
      
      // All intern data for analysis
      allAI Developer Interns: users.filter(u => u.role === 'AI Developer Intern').map(u => ({
        id: u._id.toString(),
        name: u.name,
        gitlabUsername: u.gitlabUsername,
        isActive: u.isActive,
        hasCollege: !!u.college,
        collegeId: u.college?._id?.toString(),
        collegeName: u.college?.name
      })),
      
      // All mentors data for analysis
      allTech Leads: users.filter(u => u.role === 'Tech Lead').map(u => ({
        id: u._id.toString(),
        name: u.name,
        gitlabUsername: u.gitlabUsername,
        isActive: u.isActive,
        hasCollege: !!u.college,
        collegeId: u.college?._id?.toString(),
        collegeName: u.college?.name
      })),
      
      // All super-mentors data for analysis
      allPOCs: users.filter(u => u.role === 'POC').map(u => ({
        id: u._id.toString(),
        name: u.name,
        gitlabUsername: u.gitlabUsername,
        isActive: u.isActive,
        hasCollege: !!u.college,
        collegeId: u.college?._id?.toString(),
        collegeName: u.college?.name
      }))
    };

    return NextResponse.json(debug);

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch debug data',
      details: error.message
    }, { status: 500 });
  }
}