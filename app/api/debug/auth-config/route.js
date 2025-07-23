import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const config = {
      GITLAB_CLIENT_ID: process.env.GITLAB_CLIENT_ID ? 'Set' : 'Missing',
      GITLAB_CLIENT_SECRET: process.env.GITLAB_CLIENT_SECRET ? 'Set' : 'Missing',
      GITLAB_ISSUER: process.env.GITLAB_ISSUER || 'Missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Missing',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing',
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Missing'
    };
    
    return NextResponse.json({
      success: true,
      config,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}