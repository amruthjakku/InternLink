import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../utils/database.js';
import User from '../../../../models/User.js';

export async function GET() {
  try {
    console.log('🔍 Auth Debug Test - Starting...');
    
    // Test database connection
    await connectToDatabase();
    console.log('✅ Database connected');
    
    // Test creating a user like the auth callback does
    const testUser = {
      gitlabUsername: 'debug-test-user',
      gitlabId: '999999',
      name: 'Debug Test User',
      email: 'debug@test.com',
      role: 'AI Developer Intern',
      profileImage: null,
      assignedBy: 'auto-registration',
      lastLoginAt: new Date()
    };
    
    // Delete existing test user if exists
    await User.deleteOne({ gitlabUsername: testUser.gitlabUsername });
    
    // Try to create new user
    const newUser = new User(testUser);
    await newUser.save();
    console.log('✅ Test user created successfully');
    
    // Test findByGitLabUsername
    const foundUser = await User.findByGitLabUsername(testUser.gitlabUsername);
    console.log('✅ User lookup successful');
    
    // Test updateLastLogin
    await foundUser.updateLastLogin();
    console.log('✅ updateLastLogin successful');
    
    // Clean up
    await User.deleteOne({ gitlabUsername: testUser.gitlabUsername });
    console.log('✅ Cleanup successful');
    
    return NextResponse.json({
      success: true,
      message: 'All auth operations working correctly',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Auth Debug Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}