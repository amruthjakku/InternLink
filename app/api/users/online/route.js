import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // In a real implementation, you would track online users
    // For now, return empty array
    const users = [];

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Error fetching online users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch online users' 
    }, { status: 500 });
  }
}