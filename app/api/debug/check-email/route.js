import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import College from '../../../../models/College';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Search for user by email
    const userByEmail = await User.findOne({ email: email }).populate('college');
    
    // Also search by GitLab username in case email doesn't match
    const emailPrefix = email.split('@')[0];
    const possibleUsernames = [
      emailPrefix,
      emailPrefix.toLowerCase(),
      'test1', // From the logs we saw
      'akshay06' // Another user mentioned
    ];
    
    const usersByUsername = await User.find({ 
      gitlabUsername: { $in: possibleUsernames } 
    }).populate('college');
    
    // Search for any users with similar emails
    const similarEmails = await User.find({
      email: { $regex: email.replace('@', '.*@'), $options: 'i' }
    }).populate('college');
    
    // Get all users for context
    const allUsers = await User.find({}).populate('college').sort({ createdAt: -1 }).limit(10);
    
    const result = {
      searchEmail: email,
      found: {
        byEmail: userByEmail ? {
          id: userByEmail._id.toString(),
          gitlabUsername: userByEmail.gitlabUsername,
          gitlabId: userByEmail.gitlabId,
          email: userByEmail.email,
          role: userByEmail.role,
          isActive: userByEmail.isActive,
          college: userByEmail.college?.name,
          createdAt: userByEmail.createdAt,
          lastLoginAt: userByEmail.lastLoginAt
        } : null,
        
        byUsername: usersByUsername.map(user => ({
          id: user._id.toString(),
          gitlabUsername: user.gitlabUsername,
          gitlabId: user.gitlabId,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          college: user.college?.name,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        })),
        
        similarEmails: similarEmails.map(user => ({
          id: user._id.toString(),
          gitlabUsername: user.gitlabUsername,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }))
      },
      
      recentUsers: allUsers.map(user => ({
        gitlabUsername: user.gitlabUsername,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      })),
      
      summary: {
        userExists: !!userByEmail,
        totalUsers: allUsers.length,
        possibleMatches: usersByUsername.length + similarEmails.length
      }
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Email check error:', error);
    return NextResponse.json({ 
      error: 'Failed to check email',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { email, gitlabUsername, action } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    if (action === 'manual_register') {
      // Manually register this user
      const existingUser = await User.findOne({ 
        $or: [
          { email: email },
          { gitlabUsername: gitlabUsername }
        ]
      });
      
      if (existingUser) {
        return NextResponse.json({ 
          error: 'User already exists',
          user: {
            gitlabUsername: existingUser.gitlabUsername,
            email: existingUser.email,
            role: existingUser.role,
            isActive: existingUser.isActive
          }
        }, { status: 409 });
      }
      
      const newUser = new User({
        gitlabUsername: gitlabUsername || email.split('@')[0],
        gitlabId: Date.now().toString(), // Temporary ID
        name: email.split('@')[0],
        email: email,
        role: 'pending',
        isActive: true,
        createdAt: new Date()
      });
      
      await newUser.save();
      
      return NextResponse.json({
        message: 'User manually registered',
        user: {
          id: newUser._id.toString(),
          gitlabUsername: newUser.gitlabUsername,
          email: newUser.email,
          role: newUser.role,
          isActive: newUser.isActive
        }
      });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    
  } catch (error) {
    console.error('Manual registration error:', error);
    return NextResponse.json({ 
      error: 'Failed to register user',
      details: error.message 
    }, { status: 500 });
  }
}