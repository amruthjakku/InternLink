import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import User from '../../../../../models/User';
import College from '../../../../../models/College';
import Cohort from '../../../../../models/Cohort';
import Task from '../../../../../models/Task';
import Attendance from '../../../../../models/Attendance';
import TaskProgress from '../../../../../models/TaskProgress';
import ActivityTracking from '../../../../../models/ActivityTracking';


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
    const body = await request.json();

    const { gitlabUsername, email, role, college, cohortId, isActive } = body;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (gitlabUsername && gitlabUsername !== user.gitlabUsername) {
      if (await User.findOne({ gitlabUsername: gitlabUsername.toLowerCase(), _id: { $ne: id } })) {
        return NextResponse.json({ error: 'GitLab username is already taken' }, { status: 409 });
      }
      user.gitlabUsername = gitlabUsername.toLowerCase();
    }

    if (email && email !== user.email) {
      if (await User.findOne({ email: email.toLowerCase(), _id: { $ne: id } })) {
        return NextResponse.json({ error: 'Email is already taken' }, { status: 409 });
      }
      user.email = email.toLowerCase();
    }

    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (cohortId) user.cohortId = cohortId;

    if (college) {
      const collegeDoc = await College.findOne({ name: college.trim() });
      if (!collegeDoc) {
        return NextResponse.json({ error: `College '${college}' not found` }, { status: 400 });
      }
      user.college = collegeDoc._id;
    }

    user.updatedAt = new Date();
    if (role !== user.role || isActive !== user.isActive || cohortId !== user.cohortId) {
      user.lastTokenRefresh = new Date();
    }

    const updatedUser = await user.save();
    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.role === 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const { hard } = request.query;
    if (hard) {
      // Hard delete
      await Promise.all([
        Task.deleteMany({ createdBy: id }),
        Attendance.deleteMany({ userId: id }),
        TaskProgress.deleteMany({ aiDeveloperInternId: id }),
        ActivityTracking.deleteMany({ userId: id }),
        User.updateMany({ assignedTechLead: id }, { $unset: { assignedTechLead: '' } }),
        College.updateOne({ techLeads: id }, { $pull: { techLeads: id } }),
      ]);
      await User.findByIdAndDelete(id);
      return NextResponse.json({ message: 'User permanently deleted' });
    } else {
      // Soft delete
      user.isActive = false;
      user.deactivatedAt = new Date();
      user.lastTokenRefresh = new Date();
      await user.save();
      return NextResponse.json({ message: 'User deactivated' });
    }

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.isActive) {
      return NextResponse.json({ error: 'User is already active' }, { status: 400 });
    }

    // Check for conflicts before reactivating
    const conflict = await User.findOne({
      $or: [{ gitlabUsername: user.gitlabUsername }, { email: user.email }],
      _id: { $ne: id },
      isActive: true,
    });
    if (conflict) {
      return NextResponse.json({ error: 'GitLab username or email is already in use by an active user' }, { status: 409 });
    }

    user.isActive = true;
    user.reactivatedAt = new Date();
    user.lastTokenRefresh = new Date();
    user.deactivatedAt = null;
    user.deactivationReason = null;
    await user.save();

    return NextResponse.json({ message: 'User reactivated successfully' });

  } catch (error) {
    console.error('Error reactivating user:', error);
    return NextResponse.json({ error: 'Failed to reactivate user' }, { status: 500 });
  }
}
