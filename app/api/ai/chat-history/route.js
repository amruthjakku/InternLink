import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'Tech Lead' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // In a real implementation, you would fetch chat history from database
    // For now, return empty history
    const history = [];

    return NextResponse.json({ history });

  } catch (error) {
    console.error('Error fetching AI chat history:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch chat history' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'Tech Lead' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, type } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    await connectToDatabase();

    const chatMessage = {
      userId: session.user.id,
      message,
      type: type || 'user',
      timestamp: new Date()
    };

    // In a real implementation, you would save to chat history collection
    // and potentially call an AI service to get a response

    return NextResponse.json({ 
      success: true,
      message: 'Message saved successfully' 
    });

  } catch (error) {
    console.error('Error saving AI chat message:', error);
    return NextResponse.json({ 
      error: 'Failed to save message' 
    }, { status: 500 });
  }
}