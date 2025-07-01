import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';

export const dynamic = 'force-dynamic';

// GET user preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return dashboard preferences with defaults if not set
    const preferences = {
      tabOrder: user.dashboardPreferences?.tabOrder || ['progress', 'tasks', 'performance', 'gitlab', 'meetings', 'profile', 'leaderboard', 'attendance', 'chat', 'ai-assistant']
    };

    return NextResponse.json({ preferences });

  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch preferences',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// PUT update user preferences
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { preferences } = await request.json();

    if (!preferences) {
      return NextResponse.json({ error: 'Preferences data is required' }, { status: 400 });
    }

    // Validate tab order contains valid tab names
    const validTabs = ['progress', 'tasks', 'performance', 'gitlab', 'meetings', 'profile', 'leaderboard', 'attendance', 'chat', 'ai-assistant'];
    
    if (preferences.tabOrder) {
      const invalidTabs = preferences.tabOrder.filter(tab => !validTabs.includes(tab));
      if (invalidTabs.length > 0) {
        return NextResponse.json({ 
          error: 'Invalid tab names in tabOrder',
          invalidTabs 
        }, { status: 400 });
      }
    }



    // Update user preferences
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Initialize dashboardPreferences if it doesn't exist
    if (!user.dashboardPreferences) {
      user.dashboardPreferences = {};
    }

    // Update preferences
    if (preferences.tabOrder !== undefined) {
      user.dashboardPreferences.tabOrder = preferences.tabOrder;
    }

    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json({ 
      message: 'Preferences updated successfully',
      preferences: {
        tabOrder: user.dashboardPreferences.tabOrder
      }
    });

  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json({ 
      error: 'Failed to update preferences',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// POST reset preferences to default
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Reset to default preferences
    user.dashboardPreferences = {
      tabOrder: ['progress', 'tasks', 'performance', 'gitlab', 'meetings', 'profile', 'leaderboard', 'attendance', 'chat', 'ai-assistant']
    };

    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json({ 
      message: 'Preferences reset to default successfully',
      preferences: user.dashboardPreferences
    });

  } catch (error) {
    console.error('Error resetting user preferences:', error);
    return NextResponse.json({ 
      error: 'Failed to reset preferences',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}