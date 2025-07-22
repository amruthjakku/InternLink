import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../utils/database';
import Message from '../../../models/Message';
import ChatRoom from '../../../models/ChatRoom';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    await connectToDatabase();

    // Fetch messages from database
    let query = { isDeleted: { $ne: true } };
    if (chatId) {
      query.chatRoom = chatId;
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email gitlabUsername')
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    // Format messages for frontend
    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      chatId: msg.chatRoom,
      sender: msg.sender?.name || 'Unknown',
      message: msg.content,
      timestamp: new Date(msg.createdAt).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isOwn: msg.sender?._id?.toString() === session.user.id,
      avatar: msg.sender?.name?.charAt(0) || 'U',
      type: msg.type || 'text'
    }));

    return NextResponse.json({ messages: formattedMessages });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch messages' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    console.log('🔐 Checking session for message POST...');
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Session found:', { userId: session.user.id, name: session.user.name });

    const { chatId, message, type } = await request.json();
    console.log('📝 Message data received:', { chatId, message: message?.substring(0, 50), type });

    if (!chatId || !message) {
      console.log('❌ Missing required fields:', { chatId: !!chatId, message: !!message });
      return NextResponse.json({ error: 'Chat ID and message are required' }, { status: 400 });
    }

    await connectToDatabase();

    // Create and save the message
    console.log('💾 Creating message...');
    const newMessage = new Message({
      chatRoom: chatId,
      sender: session.user.id,
      content: message.trim(),
      type: type || 'text'
    });

    console.log('💾 Saving message to database...');
    const savedMessage = await newMessage.save();
    console.log('✅ Message saved:', savedMessage._id);

    // Update chat room's last activity
    await ChatRoom.findByIdAndUpdate(chatId, {
      lastActivity: new Date()
    });

    // Populate sender info for response
    await savedMessage.populate('sender', 'name email gitlabUsername');

    // Format response message
    const responseMessage = {
      id: savedMessage._id,
      chatId: savedMessage.chatRoom,
      sender: savedMessage.sender?.name || 'You',
      message: savedMessage.content,
      timestamp: new Date(savedMessage.createdAt).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isOwn: true,
      avatar: savedMessage.sender?.name?.charAt(0) || 'U',
      type: savedMessage.type
    };

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully',
      data: responseMessage
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ 
      error: 'Failed to send message' 
    }, { status: 500 });
  }
}