import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import { connectToDatabase } from '../../../../lib/mongoose';

// Cache for user data to reduce database queries
const USER_CACHE = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute cache for user data

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Create cache key based on user's gitlabUsername and timestamp
    // We include a timestamp component to ensure we don't serve very stale data
    // but still benefit from caching during rapid tab switches
    const cacheKey = `user-${session.user.gitlabUsername}-${Math.floor(Date.now() / (CACHE_TTL / 2))}`;
    
    // Check cache first
    const cachedData = USER_CACHE.get(cacheKey);
    if (cachedData && cachedData.timestamp > Date.now() - CACHE_TTL) {
      console.log('Returning cached user data for session refresh');
      return NextResponse.json({ user: cachedData.data });
    }

    try {
      // Connect to database - this uses our optimized connection manager
      await connectToDatabase();
      console.log('Connected to database for session refresh');
    } catch (dbError) {
      console.error('Database connection error during session refresh:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed. Please try again later.' 
      }, { status: 500 });
    }
    
    // Import models dynamically to prevent schema re-compilation
    const { default: User } = await import('../../../../models/User');
    
    // Fetch the latest user data from database
    let user;
    try {
      // Don't try to populate cohortId to avoid the schema error
      user = await User.findOne({ 
        gitlabUsername: session.user.gitlabUsername.toLowerCase() 
      }).populate('college');
      
      console.log('Found user for session refresh:', user?.gitlabUsername);
    } catch (userError) {
      console.error('Error finding user during session refresh:', userError);
      return NextResponse.json({ 
        error: 'Failed to retrieve user information' 
      }, { status: 500 });
    }
    
    if (!user) {
      console.error('User not found during session refresh:', session.user.gitlabUsername);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return updated user data
    const updatedUserData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      gitlabUsername: user.gitlabUsername,
      gitlabId: user.gitlabId,
      college: user.college,
      assignedBy: user.assignedBy,
      profileImage: user.profileImage,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    // Cache the user data
    USER_CACHE.set(cacheKey, {
      data: updatedUserData,
      timestamp: Date.now()
    });

    return NextResponse.json({ user: updatedUserData });

  } catch (error) {
    console.error('Error refreshing session:', error);
    return NextResponse.json({ 
      error: 'Failed to refresh session' 
    }, { status: 500 });
  }
}

// Helper function to clear cache entries older than TTL
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of USER_CACHE.entries()) {
    if (value.timestamp < now - CACHE_TTL) {
      USER_CACHE.delete(key);
    }
  }
}

// Clean up cache periodically
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupCache, CACHE_TTL);
}