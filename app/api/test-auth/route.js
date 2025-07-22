import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    console.log('🔍 Testing authentication...');
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log('❌ No session found in test-auth');
      return NextResponse.json({ 
        authenticated: false, 
        error: 'No session found' 
      }, { status: 401 });
    }

    console.log('✅ Session found in test-auth:', {
      userId: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role
    });

    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role
      }
    });

  } catch (error) {
    console.error('❌ Error in test-auth:', error);
    return NextResponse.json({ 
      authenticated: false,
      error: error.message 
    }, { status: 500 });
  }
}