import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../lib/mongoose';

// Cache for API responses
const API_CACHE = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute cache

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get('collegeId');
    const mentorId = searchParams.get('mentorId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Create cache key based on query parameters
    const cacheKey = `interns-${collegeId || 'all'}-${mentorId || 'all'}-${status || 'all'}-${page}-${limit}`;
    
    // Check cache first
    const cachedData = API_CACHE.get(cacheKey);
    if (cachedData && cachedData.timestamp > Date.now() - CACHE_TTL) {
      console.log('Returning cached interns data');
      return NextResponse.json(cachedData.data);
    }

    // Connect to database - this uses our optimized connection manager
    const mongoose = await connectToDatabase();
    
    // Import models dynamically to prevent schema re-compilation
    const { User } = await import('../../../models/User');
    
    // Build query based on parameters
    const query = { role: 'AI Developer Intern' };
    
    if (collegeId) query.college = collegeId;
    if (mentorId) query.assignedTechLead = mentorId;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    
    // Execute query with pagination
    const totalAIDeveloperInterns = await User.countDocuments(query);
    const interns = await User.find(query)
      .populate('college', 'name')
      .populate('assignedTechLead', 'name email')
      .populate('cohortId', 'name startDate endDate')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    // Format response
    const response = {
      interns: interns.map(intern => ({
        id: intern._id,
        name: intern.name,
        email: intern.email,
        gitlabUsername: intern.gitlabUsername,
        college: intern.college ? {
          id: intern.college._id,
          name: intern.college.name
        } : null,
        mentor: intern.assignedTechLead ? {
          id: intern.assignedTechLead._id,
          name: intern.assignedTechLead.name,
          email: intern.assignedTechLead.email
        } : null,
        cohort: intern.cohortId ? {
          id: intern.cohortId._id,
          name: intern.cohortId.name,
          startDate: intern.cohortId.startDate,
          endDate: intern.cohortId.endDate
        } : null,
        status: intern.isActive ? 'active' : 'inactive',
        createdAt: intern.createdAt,
        lastLoginAt: intern.lastLoginAt
      })),
      pagination: {
        total: totalAIDeveloperInterns,
        page,
        limit,
        pages: Math.ceil(totalAIDeveloperInterns / limit)
      }
    };
    
    // Cache the response
    API_CACHE.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });
    
    // Return response
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching interns:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch interns' 
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