import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDatabase } from '../../../../utils/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    
    const mentors = await db.collection('users')
      .find({ 
        role: { $in: ['mentor', 'super-mentor'] },
        isActive: true 
      })
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({ 
      success: true,
      mentors 
    });

  } catch (error) {
    console.error('Error fetching mentors:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch mentors' 
    }, { status: 500 });
  }
}