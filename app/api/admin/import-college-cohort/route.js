import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import Cohort from '../../../../models/Cohort';
import College from '../../../../models/College';
import User from '../../../../models/User';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { assignments } = await request.json();

    if (!assignments || !Array.isArray(assignments)) {
      return NextResponse.json({ 
        error: 'Assignments array is required' 
      }, { status: 400 });
    }

    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    for (const assignment of assignments) {
      try {
        const { cohortName, collegeName, action = 'assign' } = assignment;

        if (!cohortName || !collegeName) {
          results.failed.push({
            assignment,
            error: 'Cohort name and college name are required'
          });
          continue;
        }

        // Find cohort by name
        const cohort = await Cohort.findOne({ 
          name: cohortName.trim(), 
          isActive: true 
        });

        if (!cohort) {
          results.failed.push({
            assignment,
            error: `Cohort '${cohortName}' not found`
          });
          continue;
        }

        // Find college by name
        const college = await College.findOne({ 
          name: collegeName.trim(), 
          isActive: true 
        });

        if (!college) {
          results.failed.push({
            assignment,
            error: `College '${collegeName}' not found`
          });
          continue;
        }

        if (action === 'assign') {
          // Find users from this college who aren't assigned to any cohort
          const users = await User.find({
            college: college._id,
            isActive: true,
            cohortId: { $exists: false }
          });

          if (users.length === 0) {
            results.skipped.push({
              assignment,
              reason: `No unassigned users found in college '${collegeName}'`
            });
            continue;
          }

          // Assign users to cohort
          const assignedUsers = [];
          for (const user of users) {
            user.cohortId = cohort._id;
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

          results.successful.push({
            cohortName,
            collegeName,
            action: 'assigned',
            usersCount: assignedUsers.length,
            users: assignedUsers
          });

        } else if (action === 'unassign') {
          // Find users from this college assigned to this cohort
          const users = await User.find({
            college: college._id,
            cohortId: cohort._id,
            isActive: true
          });

          if (users.length === 0) {
            results.skipped.push({
              assignment,
              reason: `No users from college '${collegeName}' found in cohort '${cohortName}'`
            });
            continue;
          }

          // Remove users from cohort
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

          results.successful.push({
            cohortName,
            collegeName,
            action: 'unassigned',
            usersCount: unassignedUsers.length,
            users: unassignedUsers
          });
        }

      } catch (error) {
        results.failed.push({
          assignment,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${assignments.length} assignments`,
      results
    });

  } catch (error) {
    console.error('Error importing college-cohort assignments:', error);
    return NextResponse.json({ 
      error: 'Failed to import assignments',
      details: error.message
    }, { status: 500 });
  }
}

// GET endpoint to provide import template
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get all active cohorts and colleges for template
    const [cohorts, colleges] = await Promise.all([
      Cohort.find({ isActive: true }).select('name').sort({ name: 1 }),
      College.find({ isActive: true }).select('name').sort({ name: 1 })
    ]);

    const template = {
      description: 'CSV template for importing college-cohort assignments',
      headers: ['cohortName', 'collegeName', 'action'],
      sampleData: [
        {
          cohortName: 'Your Cohort Name Here',
          collegeName: 'Your College Name Here',
          action: 'assign'
        },
        {
          cohortName: 'Another Cohort Name',
          collegeName: 'Another College Name',
          action: 'assign'
        },
        {
          cohortName: 'Example Cohort',
          collegeName: 'Example College',
          action: 'unassign'
        }
      ],
      availableCohorts: cohorts.map(c => c.name),
      availableColleges: colleges.map(c => c.name),
      validActions: ['assign', 'unassign'],
      instructions: [
        '1. Replace example data with your real cohort and college names',
        '2. cohortName: Must match exactly with existing cohort name (case-sensitive)',
        '3. collegeName: Must match exactly with existing college name (case-sensitive)',
        '4. action: Use "assign" to add college users to cohort, "unassign" to remove them',
        '5. Only active users will be affected by these operations',
        '6. Check the available cohorts and colleges lists below for exact names'
      ]
    };

    return NextResponse.json(template);

  } catch (error) {
    console.error('Error generating import template:', error);
    return NextResponse.json({ 
      error: 'Failed to generate template',
      details: error.message
    }, { status: 500 });
  }
}