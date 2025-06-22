import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../utils/database';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    await connectToDatabase();

    // For now, return empty messages array
    // In a real implementation, you would fetch from a messages collection
    const messages = [];

    return NextResponse.json({ messages });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch messages' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, message, type } = await request.json();

    if (!chatId || !message) {
      return NextResponse.json({ error: 'Chat ID and message are required' }, { status: 400 });
    }

    await connectToDatabase();

    const messageData = {
      chatId,
      senderId: session.user.id,
      senderName: session.user.name,
      message,
      type: type || 'text',
      timestamp: new Date(),
      read: false
    };

    // In a real implementation, save to messages collection
    // const db = await getDatabase();
    // const result = await db.collection('messages').insertOne(messageData);

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully' 
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ 
      error: 'Failed to send message' 
    }, { status: 500 });
  }
}