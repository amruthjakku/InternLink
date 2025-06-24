import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import College from '../../../../models/College';

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
        role: { $in: ['mentor', 'super-mentor'] },
        isActive: true 
      });
      
      // If no mentor found, create a default one or make the user not require mentor
      if (!mentor) {
        // Option 1: Temporarily make assignedMentor not required for this user
        // by making them a 'pending' role first, then back to intern
        await User.findByIdAndUpdate(user._id, {
          assignedMentor: undefined,
          assignedBy: 'system-auto',
          role: 'intern',
          $unset: { assignedMentor: 1 }  // Remove the field entirely
        });
        
        return NextResponse.json({
          message: 'User fixed - removed mentor requirement temporarily',
          user: {
            id: user._id.toString(),
            gitlabUsername: user.gitlabUsername,
            email: user.email,
            role: user.role,
            needsMentorAssignment: true
          }
        });
      } else {
        // Assign the mentor
        const updatedUser = await User.findByIdAndUpdate(
          user._id,
          {
            assignedMentor: mentor._id,
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
            assignedMentor: mentor.gitlabUsername
          }
        });
      }
    }
    
    if (action === 'list_mentors') {
      const mentors = await User.find({ 
        role: { $in: ['mentor', 'super-mentor'] }
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
          $unset: { assignedMentor: 1 }
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