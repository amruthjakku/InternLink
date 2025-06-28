import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import Cohort from '../../../../models/Cohort';
import College from '../../../../models/College';
import User from '../../../../models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get all cohorts with their college information
    const cohorts = await Cohort.find({ isActive: true })
      .populate('collegeId', 'name location description')
      .populate('mentorId', 'name gitlabUsername')
      .sort({ createdAt: -1 });

    // Get colleges for each cohort with additional stats
    const cohortsWithColleges = await Promise.all(
      cohorts.map(async (cohort) => {
        // Get users assigned to this cohort
        const users = await User.find({ 
          cohortId: cohort._id, 
          isActive: true 
        }).populate('college', 'name');

        // Group users by college
        const collegeGroups = users.reduce((acc, user) => {
          if (user.college) {
            const collegeId = user.college._id.toString();
            if (!acc[collegeId]) {
              acc[collegeId] = {
                college: user.college,
                users: [],
                interns: 0,
                mentors: 0,
                superMentors: 0
              };
            }
            acc[collegeId].users.push({
              _id: user._id,
              name: user.name,
              gitlabUsername: user.gitlabUsername,
              role: user.role,
              email: user.email
            });
            
            // Count by role
            if (user.role === 'intern') acc[collegeId].interns++;
            else if (user.role === 'mentor') acc[collegeId].mentors++;
            else if (user.role === 'super-mentor') acc[collegeId].superMentors++;
          }
          return acc;
        }, {});

        return {
          _id: cohort._id,
          name: cohort.name,
          description: cohort.description,
          startDate: cohort.startDate,
          endDate: cohort.endDate,
          maxInterns: cohort.maxInterns,
          currentInterns: cohort.currentInterns,
          memberCount: cohort.memberCount,
          isActive: cohort.isActive,
          createdAt: cohort.createdAt,
          primaryCollege: cohort.collegeId,
          mentor: cohort.mentorId,
          colleges: Object.values(collegeGroups),
          totalUsers: users.length,
          totalInterns: users.filter(u => u.role === 'intern').length,
          totalMentors: users.filter(u => u.role === 'mentor').length,
          totalSuperMentors: users.filter(u => u.role === 'super-mentor').length
        };
      })
    );

    // Get all colleges for import/assignment purposes
    const allColleges = await College.find({ isActive: true })
      .select('name location description')
      .sort({ name: 1 });

    return NextResponse.json({
      cohorts: cohortsWithColleges,
      colleges: allColleges,
      total: cohortsWithColleges.length
    });

  } catch (error) {
    console.error('Error fetching cohorts-colleges data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch cohorts-colleges data',
      details: error.message
    }, { status: 500 });
  }
}

// POST endpoint to assign colleges to cohorts
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { cohortId, collegeIds, action = 'assign' } = await request.json();

    if (!cohortId || !collegeIds || !Array.isArray(collegeIds)) {
      return NextResponse.json({ 
        error: 'Cohort ID and college IDs array are required' 
      }, { status: 400 });
    }

    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    if (action === 'assign') {
      // Assign users from specified colleges to this cohort
      const users = await User.find({
        college: { $in: collegeIds },
        isActive: true,
        cohortId: { $exists: false } // Only assign unassigned users
      });

      const assignedUsers = [];
      for (const user of users) {
        user.cohortId = cohortId;
        user.assignedBy = session.user.gitlabUsername || 'admin';
        await user.save();
        assignedUsers.push({
          name: user.name,
          gitlabUsername: user.gitlabUsername,
          role: user.role
        });
      }

      // Update cohort member count
      await cohort.updateMemberCount();

      return NextResponse.json({
        success: true,
        message: `Assigned ${assignedUsers.length} users to cohort`,
        assignedUsers
      });

    } else if (action === 'unassign') {
      // Remove users from specified colleges from this cohort
      const users = await User.find({
        college: { $in: collegeIds },
        cohortId: cohortId,
        isActive: true
      });

      const unassignedUsers = [];
      for (const user of users) {
        user.cohortId = undefined;
        user.assignedBy = session.user.gitlabUsername || 'admin';
        await user.save();
        unassignedUsers.push({
          name: user.name,
          gitlabUsername: user.gitlabUsername,
          role: user.role
        });
      }

      // Update cohort member count
      await cohort.updateMemberCount();

      return NextResponse.json({
        success: true,
        message: `Removed ${unassignedUsers.length} users from cohort`,
        unassignedUsers
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error managing cohort-college assignments:', error);
    return NextResponse.json({ 
      error: 'Failed to manage assignments',
      details: error.message
    }, { status: 500 });
  }
}