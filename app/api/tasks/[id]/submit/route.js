import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import Task from '../../../../../models/Task';
import User from '../../../../../models/User';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { submissionUrl, mergeRequestUrl, notes } = await request.json();
    const taskId = params.id;

    if (!submissionUrl || !submissionUrl.trim()) {
      return NextResponse.json({ error: 'Submission URL is required' }, { status: 400 });
    }

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user is authorized to submit this task
    const user = await User.findOne({ 
      $or: [
        { _id: session.user.id },
        { gitlabUsername: session.user.gitlabUsername }
      ]
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if task is assigned to this user (individual) or their cohort
    const canSubmit = (
      // Individual assignment
      (task.assignmentType === 'individual' && 
       (task.assignedTo?.toString() === user._id.toString() || 
        task.assigneeId?.toString() === user._id.toString())) ||
      // Cohort assignment
      (task.assignmentType === 'cohort' && user.cohort === task.cohortName) ||
      // Legacy check
      task.assignedTo?.toString() === user._id.toString()
    );

    if (!canSubmit) {
      return NextResponse.json({ error: 'You are not authorized to submit this task' }, { status: 403 });
    }

    // Check if user already has a submission
    const existingSubmissionIndex = task.submissions.findIndex(
      sub => sub.internId?.toString() === user._id.toString() || 
             sub.gitlabUsername === user.gitlabUsername
    );

    const submissionData = {
      internId: user._id,
      gitlabUsername: user.gitlabUsername,
      submittedAt: new Date(),
      submissionUrl: submissionUrl.trim(),
      mergeRequestUrl: mergeRequestUrl?.trim() || null,
      status: 'submitted',
      feedback: notes?.trim() || null
    };

    if (existingSubmissionIndex >= 0) {
      // Update existing submission
      task.submissions[existingSubmissionIndex] = {
        ...task.submissions[existingSubmissionIndex],
        ...submissionData,
        submittedAt: new Date() // Update submission time
      };
    } else {
      // Add new submission
      task.submissions.push(submissionData);
    }

    // Update task status to 'review' if not already completed
    if (task.status !== 'completed' && task.status !== 'approved') {
      task.status = 'review';
    }

    await task.save();

    return NextResponse.json({
      message: 'Task submitted successfully',
      submissions: task.submissions
    });

  } catch (error) {
    console.error('Error submitting task:', error);
    return NextResponse.json({ 
      error: 'Failed to submit task' 
    }, { status: 500 });
  }
}