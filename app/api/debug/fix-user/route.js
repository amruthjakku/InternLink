import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../utils/database.js';
import User from '../../../../models/User.js';
import College from '../../../../models/College.js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/fix-user?username=amruth_jakku
 * Check and fix user account status
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    if (!username) {
      return NextResponse.json({ 
        error: 'Username parameter is required',
        usage: 'GET /api/debug/fix-user?username=your-gitlab-username'
      }, { status: 400 });
    }

    await connectToDatabase();

    console.log(`🔍 Checking user: ${username}`);
    
    let user = await User.findByGitLabUsername(username);
    
    if (!user) {
      return NextResponse.json({
        found: false,
        message: `User '${username}' not found in database`,
        suggestion: 'Try signing in first to auto-register your account'
      });
    }

    const currentStatus = {
      id: user._id.toString(),
      gitlabUsername: user.gitlabUsername,
      gitlabId: user.gitlabId,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      college: user.college,
      cohortId: user.cohortId?.toString(),
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };

    console.log(`✅ User found:`, currentStatus);

    // Check if user needs fixing
    const needsFix = !user.isActive || user.role === 'pending';
    
    if (needsFix) {
      console.log(`🔧 User needs activation - fixing...`);
      
      const oldStatus = {
        role: user.role,
        isActive: user.isActive
      };
      
      user.role = 'AI Developer Intern';
      user.isActive = true;
      user.lastTokenRefresh = new Date();
      user.sessionVersion = (user.sessionVersion || 0) + 1;
      
      await user.save();
      
      console.log(`✅ User activated:`, {
        before: oldStatus,
        after: {
          role: user.role,
          isActive: user.isActive
        }
      });

      return NextResponse.json({
        found: true,
        fixed: true,
        message: `User ${username} has been activated successfully!`,
        changes: {
          before: oldStatus,
          after: {
            role: user.role,
            isActive: user.isActive
          }
        },
        currentStatus: {
          ...currentStatus,
          role: user.role,
          isActive: user.isActive
        },
        nextSteps: [
          'Sign out of the application',
          'Sign back in to refresh your session',
          'You should now have access to the platform'
        ]
      });
    } else {
      return NextResponse.json({
        found: true,
        fixed: false,
        message: `User ${username} is already active`,
        currentStatus,
        note: 'If you\'re still getting access denied errors, try signing out and signing back in to refresh your session.'
      });
    }

  } catch (error) {
    console.error('❌ Error checking/fixing user:', error);
    return NextResponse.json({ 
      error: 'Failed to check/fix user',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { username, action } = await request.json();
    
    await connectToDatabase();
    
    if (action === 'fix_mentor_assignment') {
      // Find the user
      const user = await User.findOne({ gitlabUsername: username });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Find a mentor or super-mentor to assign
      let mentor = await User.findOne({ 
        role: { $in: ['Tech Lead', 'POC'] },
        isActive: true 
      });
      
      // If no mentor found, create a default one or make the user not require mentor
      if (!mentor) {
        // Option 1: Temporarily make assignedTech Lead not required for this user
        // by making them a 'pending' role first, then back to intern
        await User.findByIdAndUpdate(user._id, {
          assignedTech Lead: undefined,
          assignedBy: 'system-auto',
          role: 'AI Developer Intern',
          $unset: { assignedTech Lead: 1 }  // Remove the field entirely
        });
        
        return NextResponse.json({
          message: 'User fixed - removed mentor requirement temporarily',
          user: {
            id: user._id.toString(),
            gitlabUsername: user.gitlabUsername,
            email: user.email,
            role: user.role,
            needsTech LeadAssignment: true
          }
        });
      } else {
        // Assign the mentor
        const updatedUser = await User.findByIdAndUpdate(
          user._id,
          {
            assignedTech Lead: mentor._id,
            assignedBy: 'system-auto'
          },
          { new: true }
        );
        
        return NextResponse.json({
          message: 'User fixed - mentor assigned',
          user: {
            id: updatedUser._id.toString(),
            gitlabUsername: updatedUser.gitlabUsername,
            email: updatedUser.email,
            role: updatedUser.role,
            assignedTech Lead: mentor.gitlabUsername
          }
        });
      }
    }
    
    if (action === 'list_mentors') {
      const mentors = await User.find({ 
        role: { $in: ['Tech Lead', 'POC'] }
      }).select('gitlabUsername email role isActive');
      
      return NextResponse.json({ mentors });
    }
    
    if (action === 'make_user_pending') {
      // Change user role to pending to bypass mentor requirement
      const updatedUser = await User.findOneAndUpdate(
        { gitlabUsername: username },
        { 
          role: 'pending',
          assignedBy: 'system-temp',
          $unset: { assignedTech Lead: 1 }
        },
        { new: true }
      );
      
      return NextResponse.json({
        message: 'User converted to pending role',
        user: {
          gitlabUsername: updatedUser.gitlabUsername,
          role: updatedUser.role,
          email: updatedUser.email
        }
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Fix user error:', error);
    return NextResponse.json({ 
      error: 'Failed to fix user',
      details: error.message 
    }, { status: 500 });
  }
}