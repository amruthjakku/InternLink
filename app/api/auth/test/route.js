import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';

export async function GET() {
  try {
    console.log('Auth test endpoint called');
    
    // Test environment variables
    const envCheck = {
      GITLAB_CLIENT_ID: !!process.env.GITLAB_CLIENT_ID,
      GITLAB_CLIENT_SECRET: !!process.env.GITLAB_CLIENT_SECRET,
      GITLAB_ISSUER: process.env.GITLAB_ISSUER,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      MONGODB_URI: !!process.env.MONGODB_URI,
    };

    // Test OAuth URLs
    const oauthUrls = {
      authorization: `${process.env.GITLAB_ISSUER}/oauth/authorize`,
      token: `${process.env.GITLAB_ISSUER}/oauth/token`,
      userinfo: `${process.env.GITLAB_ISSUER}/api/v4/user`,
      callback: `${process.env.NEXTAUTH_URL}/api/auth/callback/gitlab`
    };

    // Test database connection
    let dbStatus = 'unknown';
    try {
      const { connectToDatabase } = await import('../../../../lib/mongoose.js');
      await connectToDatabase();
      dbStatus = 'connected';
    } catch (dbError) {
      dbStatus = `error: ${dbError.message}`;
    }

    // Test session
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      success: true,
      environment: envCheck,
      oauthUrls,
      database: dbStatus,
      session: session ? {
        user: session.user,
        expires: session.expires,
        error: session.error
      } : null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}