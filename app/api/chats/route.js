import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../utils/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // For now, return empty chats array
    // In a real implementation, you would fetch from a chats collection
    const chats = [];

    return NextResponse.json({ chats });

  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch chats' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, type, participants } = await request.json();

    if (!name || !participants || participants.length === 0) {
      return NextResponse.json({ error: 'Chat name and participants are required' }, { status: 400 });
    }

    await connectToDatabase();

    const chatData = {
      name,
      type: type || 'group',
      participants: [...participants, session.user.id],
      createdBy: session.user.id,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    // In a real implementation, save to chats collection
    // const db = await getDatabase();
    // const result = await db.collection('chats').insertOne(chatData);

    return NextResponse.json({ 
      success: true, 
      message: 'Chat created successfully' 
    });

  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ 
      error: 'Failed to create chat' 
    }, { status: 500 });
  }
}