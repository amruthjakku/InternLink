import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import User from '../../../../../models/User';
import College from '../../../../../models/College';


// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = params;
    const requestData = await request.json();
    const { 
      name, 
      email, 
      role, 
      college, 
      gitlabUsername, 
      isActive, 
      cohortId,
      forceReactivation = false 
    } = requestData;

    console.log(`🔄 Updating user ${id} with data:`, requestData);

    // Validate required fields
    if (!name || !email || !role || !gitlabUsername) {
      return NextResponse.json({ 
        error: 'Name, email, role, and GitLab username are required' 
      }, { status: 400 });
    }

    // Find the user (include inactive users for reactivation)
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`📋 Current user state: Active: ${user.isActive}, Role: ${user.role}, Cohort: ${user.cohortId}`);

    // Store original state for logging
    const originalState = {
      isActive: user.isActive,
      role: user.role,
      cohortId: user.cohortId,
      college: user.college
    };

    // Check if GitLab username is already taken by another active user
    if (gitlabUsername !== user.gitlabUsername) {
      const existingUser = await User.findOne({ 
        gitlabUsername: gitlabUsername.toLowerCase(),
        _id: { $ne: id },
        isActive: true // Only check active users for conflicts
      });
      
      if (existingUser) {
        return NextResponse.json({ 
          error: 'GitLab username is already taken by another active user' 
        }, { status: 400 });
      }
    }

    // Check if email is already taken by another active user
    if (email !== user.email) {
      const existingEmailUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id },
        isActive: true // Only check active users for conflicts
      });
      
      if (existingEmailUser) {
        return NextResponse.json({ 
          error: 'Email is already taken by another active user' 
        }, { status: 400 });
      }
    }

    // Find college ObjectId if college is provided
    let collegeId = null;
    if (college && (role === 'AI Developer Intern' || role === 'Tech Lead' || role === 'POC')) {
      const collegeDoc = await College.findOne({ 
        name: college.trim(),
        isActive: true 
      });
      
      if (!collegeDoc) {
        return NextResponse.json({ 
          error: `College "${college}" not found. Please make sure the college exists.` 
        }, { status: 400 });
      }
      
      collegeId = collegeDoc._id;
    }

    // Validate college for roles that require it
    if ((role === 'AI Developer Intern' || role === 'Tech Lead' || role === 'POC') && !college) {
      return NextResponse.json({ 
        error: 'College is required for intern, mentor, and super-mentor roles' 
      }, { status: 400 });
    }

    // Validate cohort if provided
    let validatedCohortId = cohortId;
    if (cohortId) {
      const cohort = await Cohort.findById(cohortId);
      if (!cohort) {
        return NextResponse.json({ 
          error: 'Selected cohort not found' 
        }, { status: 400 });
      }
      console.log(`✅ Cohort validated: ${cohort.name}`);
    } else if (cohortId === null || cohortId === '') {
      validatedCohortId = null; // Explicitly remove cohort
    }

    // If changing to mentor role and college is provided, check if college already has a mentor
    if (role === 'Tech Lead' && collegeId && user.role !== 'Tech Lead') {
      const existingTech Lead = await User.findOne({ 
        role: 'Tech Lead', 
        college: collegeId, 
        isActive: true,
        _id: { $ne: id } // Exclude current user
      });

      if (existingTech Lead) {
        return NextResponse.json({ 
          error: 'This college already has a mentor assigned' 
        }, { status: 400 });
      }

      // Update college with mentor username
      await College.findByIdAndUpdate(collegeId, {
        mentorUsername: gitlabUsername.toLowerCase()
      });
    }

    // Prepare update data
    const updateData = {
      name,
      email: email.toLowerCase(),
      gitlabUsername: gitlabUsername.toLowerCase(),
      role,
      updatedAt: new Date()
    };

    // Handle activation/deactivation
    if (isActive !== undefined) {
      updateData.isActive = isActive;
      
      // Special handling for reactivation
      if (isActive && !user.isActive) {
        console.log(`🔄 Reactivating user: ${user.gitlabUsername}`);
        updateData.lastTokenRefresh = new Date(); // Force session refresh
        
        // Clear any deactivation-related flags
        updateData.deactivatedAt = null;
        updateData.deactivationReason = null;
      } else if (!isActive && user.isActive) {
        console.log(`🔄 Deactivating user: ${user.gitlabUsername}`);
        updateData.deactivatedAt = new Date();
        updateData.lastTokenRefresh = new Date(); // Force session refresh
      }
    }

    // Handle college assignment
    if (collegeId) {
      updateData.college = collegeId;
    }

    // Handle cohort assignment/removal
    if (validatedCohortId !== undefined) {
      updateData.cohortId = validatedCohortId;
      console.log(`🎯 Cohort assignment: ${validatedCohortId ? 'Assigning to ' + validatedCohortId : 'Removing cohort'}`);
    }

    // Add token refresh trigger for significant changes
    if (updateData.role !== user.role || 
        updateData.isActive !== user.isActive || 
        updateData.cohortId !== user.cohortId) {
      updateData.lastTokenRefresh = new Date();
      console.log(`🔄 Triggering token refresh for significant changes: ${updateData.gitlabUsername || 'unknown'}`);
    }

    // Update user with validation
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    ).populate(['college', 'cohortId']);

    // Log the changes
    const changes = [];
    if (originalState.isActive !== updatedUser.isActive) {
      changes.push(`Status: ${originalState.isActive ? 'Active' : 'Inactive'} → ${updatedUser.isActive ? 'Active' : 'Inactive'}`);
    }
    if (originalState.role !== updatedUser.role) {
      changes.push(`Role: ${originalState.role} → ${updatedUser.role}`);
    }
    if (String(originalState.cohortId) !== String(updatedUser.cohortId)) {
      const oldCohort = originalState.cohortId ? 'Assigned' : 'None';
      const newCohort = updatedUser.cohortId ? updatedUser.cohortId.name || 'Assigned' : 'None';
      changes.push(`Cohort: ${oldCohort} → ${newCohort}`);
    }

    console.log(`✅ User updated: ${updatedUser.gitlabUsername} - ${changes.join(', ') || 'Basic info updated'}`);

    return NextResponse.json({
      ...updatedUser.toObject(),
      _updateSummary: {
        changes: changes,
        timestamp: new Date(),
        updatedBy: session.user.gitlabUsername
      }
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ 
      error: 'Failed to update user',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';
    const reason = searchParams.get('reason') || 'Admin action';

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (user.gitlabUsername === session.user.gitlabUsername) {
      return NextResponse.json({ 
        error: 'Cannot delete your own account' 
      }, { status: 400 });
    }

    if (hardDelete) {
      // Hard delete - completely remove from database
      console.log(`🗑️ Hard deleting user: ${user.gitlabUsername} (${user.name})`);
      
      // TODO: Clean up related data (tasks, attendance, etc.)
      await User.findByIdAndDelete(id);
      
      return NextResponse.json({ 
        message: 'User permanently deleted',
        action: 'hard_delete',
        deletedUser: {
          id: user._id,
          gitlabUsername: user.gitlabUsername,
          name: user.name
        }
      });
    } else {
      // Soft delete - set isActive to false
      console.log(`🔄 Soft deleting user: ${user.gitlabUsername} (${user.name}) - Reason: ${reason}`);
      
      const updateData = {
        isActive: false,
        deactivatedAt: new Date(),
        deactivationReason: reason,
        deactivatedBy: session.user.gitlabUsername,
        lastTokenRefresh: new Date(), // Force session refresh
        updatedAt: new Date()
      };

      const updatedUser = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate(['college', 'cohortId']);

      console.log(`✅ User soft deleted: ${updatedUser.gitlabUsername} - Now inactive`);

      return NextResponse.json({ 
        message: 'User deactivated successfully',
        action: 'soft_delete',
        user: {
          id: updatedUser._id,
          gitlabUsername: updatedUser.gitlabUsername,
          name: updatedUser.name,
          isActive: updatedUser.isActive,
          deactivatedAt: updatedUser.deactivatedAt,
          deactivationReason: updatedUser.deactivationReason
        }
      });
    }

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ 
      error: 'Failed to delete user',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * PATCH endpoint for reactivating users
 */
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = params;
    const { action, reason } = await request.json();

    if (action !== 'reactivate') {
      return NextResponse.json({ 
        error: 'Only reactivate action is supported' 
      }, { status: 400 });
    }

    // Find the user (including inactive ones)
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isActive) {
      return NextResponse.json({ 
        error: 'User is already active' 
      }, { status: 400 });
    }

    console.log(`🔄 Reactivating user: ${user.gitlabUsername} (${user.name}) - Reason: ${reason || 'Admin action'}`);

    // Check for conflicts with active users
    const conflicts = await User.find({
      $or: [
        { gitlabUsername: user.gitlabUsername },
        { email: user.email }
      ],
      _id: { $ne: id },
      isActive: true
    });

    if (conflicts.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot reactivate: GitLab username or email is already in use by another active user',
        conflicts: conflicts.map(u => ({
          id: u._id,
          gitlabUsername: u.gitlabUsername,
          email: u.email,
          name: u.name
        }))
      }, { status: 409 });
    }

    // Reactivate the user
    const updateData = {
      isActive: true,
      reactivatedAt: new Date(),
      reactivationReason: reason || 'Admin action',
      reactivatedBy: session.user.gitlabUsername,
      lastTokenRefresh: new Date(), // Force session refresh
      updatedAt: new Date(),
      // Clear deactivation fields
      deactivatedAt: null,
      deactivationReason: null,
      deactivatedBy: null
    };

    const reactivatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate(['college', 'cohortId']);

    console.log(`✅ User reactivated: ${reactivatedUser.gitlabUsername} - Now active`);

    return NextResponse.json({ 
      message: 'User reactivated successfully',
      action: 'reactivate',
      user: {
        id: reactivatedUser._id,
        gitlabUsername: reactivatedUser.gitlabUsername,
        name: reactivatedUser.name,
        isActive: reactivatedUser.isActive,
        reactivatedAt: reactivatedUser.reactivatedAt,
        reactivationReason: reactivatedUser.reactivationReason
      }
    });

  } catch (error) {
    console.error('Error reactivating user:', error);
    return NextResponse.json({ 
      error: 'Failed to reactivate user',
      details: error.message 
    }, { status: 500 });
  }
}