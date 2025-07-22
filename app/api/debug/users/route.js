import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    await connectToDatabase();

    // Get all users to debug
    const allUsers = await User.find({}).select('gitlabUsername name email role isActive createdAt').sort({ createdAt: -1 });
    
    console.log('🔍 Debug Users - Total users in database:', allUsers.length);
    
    const debugData = {
      totalUsers: allUsers.length,
      users: allUsers.map(user => ({
        id: user._id.toString(),
        gitlabUsername: user.gitlabUsername,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      })),
      activeUsers: allUsers.filter(u => u.isActive).length,
      inactiveUsers: allUsers.filter(u => !u.isActive).length,
      roleBreakdown: {
        admin: allUsers.filter(u => u.role === 'admin').length,
        'POC': allUsers.filter(u => u.role === 'POC').length,
        'Tech Lead': allUsers.filter(u => u.role === 'Tech Lead').length,
        'AI developer Intern': allUsers.filter(u => u.role === 'AI developer Intern').length,
        pending: allUsers.filter(u => u.role === 'pending').length
      }
    };

    console.log('🔍 Debug Users - Summary:', {
      total: debugData.totalUsers,
      active: debugData.activeUsers,
      roles: debugData.roleBreakdown
    });

    return NextResponse.json(debugData);

  } catch (error) {
    console.error('❌ Debug users error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch debug data',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { username } = await request.json();
    
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    await connectToDatabase();

    console.log('🔍 Debug - Testing username lookup for:', username);
    
    // Test different query variations
    const tests = [
      { name: 'Exact match', query: { gitlabUsername: username } },
      { name: 'Lowercase', query: { gitlabUsername: username.toLowerCase() } },
      { name: 'Active only', query: { gitlabUsername: username.toLowerCase(), isActive: true } },
      { name: 'Case insensitive regex', query: { gitlabUsername: new RegExp(`^${username}$`, 'i') } }
    ];

    const results = {};
    
    for (const test of tests) {
      try {
        const result = await User.findOne(test.query);
        results[test.name] = {
          found: !!result,
          user: result ? {
            id: result._id.toString(),
            gitlabUsername: result.gitlabUsername,
            role: result.role,
            isActive: result.isActive
          } : null
        };
        console.log(`🔍 Debug - ${test.name}:`, results[test.name]);
      } catch (err) {
        results[test.name] = { error: err.message };
      }
    }

    return NextResponse.json({
      username,
      tests: results
    });

  } catch (error) {
    console.error('❌ Debug username lookup error:', error);
    return NextResponse.json({ 
      error: 'Failed to test username lookup',
      details: error.message
    }, { status: 500 });
  }
}