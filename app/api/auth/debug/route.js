import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = {
      GITLAB_CLIENT_ID: process.env.GITLAB_CLIENT_ID ? `${process.env.GITLAB_CLIENT_ID.substring(0, 10)}...` : 'Not Set',
      GITLAB_CLIENT_SECRET: process.env.GITLAB_CLIENT_SECRET ? 'Set (hidden)' : 'Not Set',
      GITLAB_ISSUER: process.env.GITLAB_ISSUER || 'Not Set',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Not Set',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set (hidden)' : 'Not Set',
    };

    return NextResponse.json({
      message: 'Auth Debug Info',
      config,
      expectedCallbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/gitlab`,
      fullClientId: process.env.GITLAB_CLIENT_ID,
      oauthUrl: `${process.env.GITLAB_ISSUER}/oauth/authorize`,
      tokenUrl: `${process.env.GITLAB_ISSUER}/oauth/token`,
      userinfoUrl: `${process.env.GITLAB_ISSUER}/api/v4/user`
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error.message 
    }, { status: 500 });
  }
}