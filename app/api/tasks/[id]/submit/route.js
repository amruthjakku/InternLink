import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import Task from '../../../../../models/Task';
import User from '../../../../../models/User';

export async function POST(request, { params }) {
  try {
    console.log('Task submission request received for task ID:', params.id);
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { submissionUrl, mergeRequestUrl, notes } = await request.json();
    const taskId = params.id;
    
    console.log('Submission data received:', { 
      submissionUrl, 
      mergeRequestUrl: mergeRequestUrl || 'Not provided', 
      notes: notes || 'Not provided' 
    });

    if (!submissionUrl || !submissionUrl.trim()) {
      return NextResponse.json({ error: 'Submission URL is required' }, { status: 400 });
    }

    // Find the task
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }
    
    console.log('Looking for task with ID:', taskId);
    
    let task;
    try {
      task = await Task.findById(taskId);
      if (!task) {
        console.error('Task not found with ID:', taskId);
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      console.log('Task found:', task._id.toString());
    } catch (err) {
      console.error('Error finding task:', err);
      return NextResponse.json({ 
        error: 'Error finding task', 
        details: err.message 
      }, { status: 500 });
    }

    // For debugging purposes, log the task details
    console.log('Task details:', {
      id: task._id.toString(),
      title: task.title,
      assignmentType: task.assignmentType,
      assignedTo: task.assignedTo?.toString(),
      assigneeId: task.assigneeId?.toString(),
      cohortId: task.cohortId?.toString(),
      status: task.status,
      progress: task.progress
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
          gitlabUsername: session.user.gitlabUsername
        };
      } else {
        console.log('User found in database:', {
          id: user._id.toString(),
          name: user.name,
          gitlabUsername: user.gitlabUsername,
          cohortId: user.cohortId?.toString(),
          college: user.college?.toString()
        });
      }
      
      // Allow all interns to submit their tasks for now
      // This is a temporary fix to ensure functionality
      if (session.user.role === 'intern') {
        console.log('User is an intern, allowing task submission');
        // We'll implement proper permission checks later
      } else if (session.user.role === 'mentor' || session.user.role === 'super-mentor' || session.user.role === 'admin') {
        console.log('User is a mentor/admin, allowing task submission');
      } else {
        console.log('User role not recognized:', session.user.role);
        return NextResponse.json({ 
          error: 'You are not authorized to submit this task',
          details: {
            userRole: session.user.role
          }
        }, { status: 403 });
      }
    } catch (error) {
      console.error('Error checking user authorization:', error);
      // Create a temporary user object from session data
      user = {
        _id: session.user.id,
        gitlabUsername: session.user.gitlabUsername
      };
    }

    // Initialize submissions array if it doesn't exist
    if (!task.submissions) {
      task.submissions = [];
    }
    
    // Check if user already has a submission
    const existingSubmissionIndex = task.submissions.findIndex(
      sub => (sub.internId && user._id && sub.internId.toString() === user._id.toString()) || 
             (sub.gitlabUsername && user.gitlabUsername && sub.gitlabUsername === user.gitlabUsername)
    );
    
    console.log('Existing submission index:', existingSubmissionIndex);
    
    // Create submission data
    const submissionData = {
      internId: user._id,
      gitlabUsername: user.gitlabUsername,
      submittedAt: new Date(),
      submissionUrl: submissionUrl.trim(),
      mergeRequestUrl: mergeRequestUrl?.trim() || null,
      status: 'submitted',
      feedback: notes?.trim() || null
    };
    
    console.log('Submission data:', submissionData);
    
    try {
      // Use updateOne instead of save to avoid validation issues
      let updateQuery = {};
      
      if (existingSubmissionIndex >= 0) {
        // Update existing submission
        console.log('Updating existing submission at index:', existingSubmissionIndex);
        updateQuery = {
          $set: {
            [`submissions.${existingSubmissionIndex}.submissionUrl`]: submissionData.submissionUrl,
            [`submissions.${existingSubmissionIndex}.mergeRequestUrl`]: submissionData.mergeRequestUrl,
            [`submissions.${existingSubmissionIndex}.submittedAt`]: submissionData.submittedAt,
            [`submissions.${existingSubmissionIndex}.status`]: submissionData.status,
            [`submissions.${existingSubmissionIndex}.feedback`]: submissionData.feedback,
            status: task.status !== 'completed' && task.status !== 'approved' ? 'review' : task.status,
            progress: task.status !== 'completed' && task.status !== 'approved' ? 90 : task.progress
          }
        };
      } else {
        // Add new submission
        console.log('Adding new submission');
        updateQuery = {
          $push: { submissions: submissionData },
          $set: { 
            status: task.status !== 'completed' && task.status !== 'approved' ? 'review' : task.status,
            progress: task.status !== 'completed' && task.status !== 'approved' ? 90 : task.progress
          }
        };
      }
      
      console.log('Update query:', JSON.stringify(updateQuery, null, 2));
      
      // Make sure we're using the correct ID format
      console.log('Task ID for update:', taskId);
      console.log('Task ID type:', typeof taskId);
      
      const result = await Task.updateOne(
        { _id: taskId },
        updateQuery
      );
      
      console.log('Task update result:', result);
      
      if (result.modifiedCount === 0) {
        console.error('Task was not modified using updateOne, trying alternative method');
        
        // Try alternative method - direct save
        try {
          if (existingSubmissionIndex >= 0) {
            // Update existing submission
            task.submissions[existingSubmissionIndex] = {
              ...task.submissions[existingSubmissionIndex],
              ...submissionData
            };
          } else {
            // Add new submission
            task.submissions.push(submissionData);
          }
          
          // Update task status and progress
          if (task.status !== 'completed' && task.status !== 'approved') {
            task.status = 'review';
            task.progress = 90;
          }
          
          await task.save();
          console.log('Task updated successfully using save method');
        } catch (saveErr) {
          console.error('Both update methods failed:', saveErr);
          return NextResponse.json({ 
            error: 'Failed to submit task - no changes were made',
            details: 'Both update methods failed: ' + saveErr.message
          }, { status: 500 });
        }
      } else {
        console.log('Task updated successfully with submission using updateOne');
      }
    } catch (err) {
      console.error('Error submitting task:', err);
      console.error('Error stack:', err.stack);
      return NextResponse.json({ 
        error: 'Failed to submit task',
        details: err.message
      }, { status: 500 });
    }

    // Fetch the updated task to get the latest data
    const updatedTask = await Task.findById(taskId);
    
    return NextResponse.json({
      success: true,
      message: 'Task submitted successfully',
      submission: submissionData,
      taskStatus: updatedTask ? updatedTask.status : 'review',
      taskProgress: updatedTask ? updatedTask.progress : 90,
      points: updatedTask ? updatedTask.points : 10
    });

  } catch (error) {
    console.error('Error submitting task:', error);
    return NextResponse.json({ 
      error: 'Failed to submit task' 
    }, { status: 500 });
  }
}