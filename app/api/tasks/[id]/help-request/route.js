import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../lib/database';
import Task from '../../../../../models/Task';
import User from '../../../../../models/User';
import Notification from '../../../../../models/Notification';
import mongoose from 'mongoose';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const data = await request.json();
    const { message } = data;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Help request message is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Find the task
    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // For debugging purposes, log the task details
    console.log('Task details:', {
      id: task._id.toString(),
      title: task.title,
      assignmentType: task.assignmentType,
      assignedTo: task.assignedTo?.toString(),
      assigneeId: task.assigneeId?.toString(),
      cohortId: task.cohortId?.toString(),
      status: task.status
    });
    
    // For debugging purposes, log the user details from the session
    console.log('Session user details:', {
      id: session.user.id,
      gitlabUsername: session.user.gitlabUsername,
      role: session.user.role,
      cohortId: session.user.cohortId
    });
    
    let user;
    try {
      // Find the user in the database
      user = await User.findOne({ 
        $or: [
          { _id: session.user.id },
          { gitlabUsername: session.user.gitlabUsername }
        ]
      });

      if (!user) {
        console.error('User not found in database:', session.user.id);
        // Create a temporary user object from session data
        user = {
          _id: session.user.id,
          name: session.user.name || session.user.gitlabUsername,
          gitlabUsername: session.user.gitlabUsername
        };
      } else {
        console.log('User found in database:', {
          id: user._id.toString(),
          name: user.name,
          gitlabUsername: user.gitlabUsername
        });
      }
    } catch (error) {
      console.error('Error finding user:', error);
      // Create a temporary user object from session data
      user = {
        _id: session.user.id,
        name: session.user.name || session.user.gitlabUsername,
        gitlabUsername: session.user.gitlabUsername
      };
    }

    // Create help request
    const helpRequest = {
      internId: user._id,
      internName: user.name,
      gitlabUsername: user.gitlabUsername,
      message: message.trim(),
      requestedAt: new Date(),
      status: 'pending'
    };

    // Add help request to task
    task.helpRequests = task.helpRequests || [];
    task.helpRequests.push(helpRequest);
    
    // Add a comment about the help request
    task.comments = task.comments || [];
    task.comments.push({
      author: user.name || user.gitlabUsername,
      text: `Help requested: ${message.trim()}`,
      timestamp: new Date(),
      type: 'help_request'
    });

    await task.save();

    // Send notification to assigned mentor/admin
    const recipients = [];
    if (task.assignedTo) {
      recipients.push(task.assignedTo);
    } else if (task.cohortId) {
      // Find all mentors/admins for this cohort
      const cohortMentors = await User.find({ cohortId: task.cohortId, role: { $in: ['Tech Lead', 'POC', 'admin'] } });
      recipients.push(...cohortMentors.map(m => m._id));
    }

    if (recipients.length > 0) {
      const notification = new Notification({
        recipients,
        sender: user._id,
        type: 'help_request',
        message: `${user.name} requested help for task: ${task.title}`,
        entity: {
          type: 'Task',
          id: task._id
        }
      });
      await notification.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Help request sent successfully',
      helpRequest
    });

  } catch (error) {
    console.error('Error requesting help:', error);
    return NextResponse.json({ 
      error: 'Failed to send help request',
      details: error.message
    }, { status: 500 });
  }
}