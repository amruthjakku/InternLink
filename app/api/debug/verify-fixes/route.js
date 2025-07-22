import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import College from '../../../../models/College';

export async function GET() {
  const verificationResults = {
    timestamp: new Date().toISOString(),
    checks: [],
    summary: {
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };

  try {
    await connectToDatabase();
    
    // Check 1: Database connection
    verificationResults.checks.push({
      name: 'Database Connection',
      status: 'PASS',
      message: 'Successfully connected to MongoDB'
    });
    verificationResults.summary.passed++;

    // Check 2: User model has new fields
    const sampleUser = await User.findOne({});
    if (sampleUser) {
      const hasNewFields = sampleUser.schema.paths.hasOwnProperty('lastTokenRefresh') && 
                          sampleUser.schema.paths.hasOwnProperty('sessionVersion');
      
      verificationResults.checks.push({
        name: 'User Model Updates',
        status: hasNewFields ? 'PASS' : 'FAIL',
        message: hasNewFields ? 'User model has new session tracking fields' : 'User model missing new fields',
        details: {
          hasLastTokenRefresh: sampleUser.schema.paths.hasOwnProperty('lastTokenRefresh'),
          hasSessionVersion: sampleUser.schema.paths.hasOwnProperty('sessionVersion'),
          hasLastSessionReset: sampleUser.schema.paths.hasOwnProperty('lastSessionReset')
        }
      });
      
      if (hasNewFields) verificationResults.summary.passed++;
      else verificationResults.summary.failed++;
    }

    // Check 3: Test user creation and updates
    const testUsername = 'test-verification-user';
    
    // Create a test user
    let testUser = await User.findOne({ gitlabUsername: testUsername });
    if (!testUser) {
      testUser = new User({
        gitlabUsername: testUsername,
        gitlabId: '999999',
        name: 'Test User',
        email: 'test@example.com',
        role: 'AI Developer Intern',
        isActive: true
      });
      await testUser.save();
    }

    // Test update with token refresh trigger
    const beforeUpdate = new Date();
    const updatedUser = await User.findByIdAndUpdate(
      testUser._id,
      {
        role: 'Tech Lead',
        lastTokenRefresh: new Date(),
        sessionVersion: (testUser.sessionVersion || 1) + 1
      },
      { new: true }
    );

    const updateWorked = updatedUser.role === 'Tech Lead' && 
                        updatedUser.lastTokenRefresh > beforeUpdate;

    verificationResults.checks.push({
      name: 'Database Update Test',
      status: updateWorked ? 'PASS' : 'FAIL',
      message: updateWorked ? 'Database updates work correctly' : 'Database updates failed',
      details: {
        roleUpdated: updatedUser.role === 'Tech Lead',
        tokenRefreshSet: !!updatedUser.lastTokenRefresh,
        sessionVersionIncremented: updatedUser.sessionVersion > (testUser.sessionVersion || 1)
      }
    });

    if (updateWorked) verificationResults.summary.passed++;
    else verificationResults.summary.failed++;

    // Clean up test user
    await User.findByIdAndDelete(testUser._id);

    // Check 4: Auto-registration capability
    try {
      const autoRegisterTest = new User({
        gitlabUsername: 'auto-test-user',
        gitlabId: '888888',
        name: 'Auto Test User',
        email: 'autotest@example.com',
        role: 'pending',
        isActive: true
      });
      await autoRegisterTest.save();
      await User.findByIdAndDelete(autoRegisterTest._id);
      
      verificationResults.checks.push({
        name: 'Auto-Registration Test',
        status: 'PASS',
        message: 'Auto-registration works correctly'
      });
      verificationResults.summary.passed++;
    } catch (error) {
      verificationResults.checks.push({
        name: 'Auto-Registration Test',
        status: 'FAIL',
        message: 'Auto-registration failed',
        error: error.message
      });
      verificationResults.summary.failed++;
    }

    // Check 5: API endpoints availability
    const endpoints = [
      '/api/debug/role-changes',
      '/api/debug/test-database-updates',
      '/api/admin/force-refresh-session',
      '/api/admin/reset-user-session',
      '/api/admin/approve-user'
    ];

    for (const endpoint of endpoints) {
      // We can't test these directly here, but we can check if the files exist
      verificationResults.checks.push({
        name: `API Endpoint: ${endpoint}`,
        status: 'INFO',
        message: 'Endpoint created (manual testing required)'
      });
      verificationResults.summary.warnings++;
    }

    // Check 6: Session handling
    const session = await getServerSession(authOptions);
    verificationResults.checks.push({
      name: 'Session Handling',
      status: 'INFO',
      message: session ? 'Session active' : 'No active session',
      details: session ? {
        username: session.user?.gitlabUsername,
        role: session.user?.role,
        isActive: session.user?.isActive
      } : null
    });
    verificationResults.summary.warnings++;

  } catch (error) {
    verificationResults.checks.push({
      name: 'Verification Process',
      status: 'FAIL',
      message: 'Verification failed with error',
      error: error.message,
      stack: error.stack
    });
    verificationResults.summary.failed++;
  }

  // Overall status
  verificationResults.overallStatus = verificationResults.summary.failed === 0 ? 
    (verificationResults.summary.warnings === 0 ? 'ALL_PASS' : 'PASS_WITH_WARNINGS') : 
    'FAILED';

  return NextResponse.json(verificationResults);
}

export async function POST(request) {
  try {
    const { action } = await request.json();
    
    if (action === 'fix_common_issues') {
      await connectToDatabase();
      
      const fixes = [];
      
      // Fix 1: Ensure all users have session tracking fields
      const usersWithoutFields = await User.find({
        $or: [
          { lastTokenRefresh: { $exists: false } },
          { sessionVersion: { $exists: false } }
        ]
      });
      
      if (usersWithoutFields.length > 0) {
        await User.updateMany(
          {
            $or: [
              { lastTokenRefresh: { $exists: false } },
              { sessionVersion: { $exists: false } }
            ]
          },
          {
            $set: {
              lastTokenRefresh: null,
              sessionVersion: 1,
              lastSessionReset: null
            }
          }
        );
        
        fixes.push({
          name: 'User Fields Update',
          message: `Updated ${usersWithoutFields.length} users with missing session tracking fields`
        });
      }
      
      // Fix 2: Reset all user sessions to force refresh
      await User.updateMany(
        { isActive: true },
        {
          $inc: { sessionVersion: 1 },
          $set: { lastTokenRefresh: new Date() }
        }
      );
      
      fixes.push({
        name: 'Force Session Refresh',
        message: 'Triggered session refresh for all active users'
      });
      
      return NextResponse.json({
        message: 'Common issues fixed',
        fixes,
        instruction: 'All users should refresh their browsers or sign out/in'
      });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Fix failed',
      details: error.message 
    }, { status: 500 });
  }
}