import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, targetRole } = await request.json();

    if (!userId || !targetRole) {
      return NextResponse.json({ 
        error: 'User ID and target role are required' 
      }, { status: 400 });
    }

    if (!['super-mentor', 'mentor', 'intern'].includes(targetRole)) {
      return NextResponse.json({ 
        error: 'Invalid target role' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Get the target user
    const targetUser = await User.findById(userId).populate('college');
    if (!targetUser) {
      return NextResponse.json({ 
        error: 'Target user not found' 
      }, { status: 404 });
    }

    if (targetUser.role !== targetRole) {
      return NextResponse.json({ 
        error: 'User role does not match target role' 
      }, { status: 400 });
    }

    // Create impersonation session data
    const impersonationData = {
      originalAdmin: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role
      },
      impersonatedUser: {
        id: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        gitlabUsername: targetUser.gitlabUsername,
        college: targetUser.college,
        assignedBy: targetUser.assignedBy
      },
      impersonationStarted: new Date().toISOString()
    };

    return NextResponse.json({ 
      message: 'Impersonation session created',
      impersonationData,
      redirectUrl: getRedirectUrl(targetRole)
    });

  } catch (error) {
    console.error('Error creating impersonation session:', error);
    return NextResponse.json({ 
      error: 'Failed to create impersonation session' 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // End impersonation session
    return NextResponse.json({ 
      message: 'Impersonation session ended',
      redirectUrl: '/admin/dashboard'
    });

  } catch (error) {
    console.error('Error ending impersonation session:', error);
    return NextResponse.json({ 
      error: 'Failed to end impersonation session' 
    }, { status: 500 });
  }
}

function getRedirectUrl(role) {
  switch (role) {
    case 'super-mentor':
    case 'mentor':
      return '/mentor/dashboard';
    case 'intern':
      return '/intern/dashboard';
    default:
      return '/';
  }
}