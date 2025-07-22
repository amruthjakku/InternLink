import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../lib/mongoose';

// Cache for API responses
const API_CACHE = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds cache for super-mentor data

export async function GET() {
  try {
    console.log('Super-mentor API: Fetching college interns');
    const session = await getServerSession(authOptions);
    
    console.log('Super-mentor API: Session user:', session?.user?.email, 'Role:', session?.user?.role);
    
    if (!session || session.user.role !== 'super-mentor') {
      console.log('Super-mentor API: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create cache key based on super-mentor ID
    const cacheKey = `super-mentor-interns-${session.user.id}`;
    
    // Check cache first
    const cachedData = API_CACHE.get(cacheKey);
    if (cachedData && cachedData.timestamp > Date.now() - CACHE_TTL) {
      console.log('Super-mentor API: Returning cached interns data');
      return NextResponse.json(cachedData.data);
    }

    try {
      // Connect to database - this uses our optimized connection manager
      await connectToDatabase();
      console.log('Super-mentor API: Successfully connected to database');
    } catch (dbError) {
      console.error('Super-mentor API: Database connection error:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed. Please try again later.' 
      }, { status: 500 });
    }

    // Import models dynamically to prevent schema re-compilation
    const { default: User } = await import('../../../../models/User');

    // Get super-mentor's college
    console.log('Super-mentor API: Looking up super-mentor with ID:', session.user.id);
    let superMentor;
    try {
      superMentor = await User.findById(session.user.id).populate('college');
    } catch (userError) {
      console.error('Super-mentor API: Error finding super-mentor:', userError);
      return NextResponse.json({ 
        error: 'Failed to retrieve super-mentor information' 
      }, { status: 500 });
    }
    
    console.log('Super-mentor API: Found super-mentor:', superMentor?.name, 'College:', superMentor?.college?.name);
    
    if (!superMentor) {
      console.log('Super-mentor API: Super-mentor not found');
      return NextResponse.json({ error: 'Super-mentor not found' }, { status: 404 });
    }
    
    if (!superMentor.college) {
      console.log('Super-mentor API: Super-mentor college not found');
      return NextResponse.json({ error: 'Super-mentor college not found' }, { status: 404 });
    }

    // Get all interns in the same college
    console.log('Super-mentor API: Looking up interns for college ID:', superMentor.college._id);
    
    let interns;
    try {
      interns = await User.find({ 
        role: 'intern', 
        college: superMentor.college._id,
        isActive: true 
      })
      .populate('college', 'name')
      .populate('assignedMentor', 'name email')
      .select('gitlabUsername name email college assignedMentor isActive createdAt lastLoginAt')
      .sort({ createdAt: -1 });
      
      console.log('Super-mentor API: Found', interns.length, 'interns for college');
    } catch (internsError) {
      console.error('Super-mentor API: Error finding interns:', internsError);
      return NextResponse.json({ 
        error: 'Failed to retrieve interns information' 
      }, { status: 500 });
    }

    // Format interns for frontend
    const formattedInterns = interns.map(intern => ({
      _id: intern._id,
      id: intern._id,
      gitlabUsername: intern.gitlabUsername,
      name: intern.name,
      email: intern.email,
      college_name: intern.college?.name || 'N/A',
      status: intern.isActive ? 'active' : 'inactive',
      assignedMentor: intern.assignedMentor?._id || null,
      assignedMentorName: intern.assignedMentor?.name || null,
      createdAt: intern.createdAt,
      lastLoginAt: intern.lastLoginAt,
      // Mock data for now - these would come from other collections
      total_tasks: Math.floor(Math.random() * 20) + 5,
      completed_tasks: Math.floor(Math.random() * 15) + 2,
      completion_rate: Math.floor(Math.random() * 40) + 60,
      performance_score: Math.floor(Math.random() * 30) + 70
    }));

    const response = { interns: formattedInterns };
    
    // Cache the response
    API_CACHE.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching college interns:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch college interns' 
    }, { status: 500 });
  }
}

// Helper function to clear cache entries older than TTL
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of API_CACHE.entries()) {
    if (value.timestamp < now - CACHE_TTL) {
      API_CACHE.delete(key);
    }
  }
}

// Clean up cache periodically
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupCache, CACHE_TTL);
}