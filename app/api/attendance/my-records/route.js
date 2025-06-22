import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase, getAttendanceByUser } from '../../../../utils/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const attendance = await getAttendanceByUser(session.user.id);

    return NextResponse.json({ attendance });

  } catch (error) {
    console.error('Error fetching user attendance:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch attendance records' 
    }, { status: 500 });
  }
}