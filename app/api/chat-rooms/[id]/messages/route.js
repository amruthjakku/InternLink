import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import ChatRoom from '../../../../../models/ChatRoom';
import Message from '../../../../../models/Message';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;
    
    // Check if user has access to this chat room
    const chatRoom = await ChatRoom.findById(id);
    if (!chatRoom || !chatRoom.isActive) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    const hasAccess = 
      chatRoom.visibility === 'public' ||
      (chatRoom.visibility === 'college-only' && chatRoom.college?.toString() === session.user.college?.toString()) ||
      chatRoom.participants.some(p => p.user.toString() === session.user._id.toString()) ||
      chatRoom.createdBy.toString() === session.user._id.toString() ||
      session.user.role === 'admin';

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch messages
    const messages = await Message.find({ 
      chatRoom: id, 
      isDeleted: false 
    })
    .populate('sender', 'name email role')
    .populate('replyTo', 'content sender')
    .populate('mentions', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Get total count for pagination
    const totalMessages = await Message.countDocuments({ 
      chatRoom: id, 
      isDeleted: false 
    });

    return NextResponse.json({ 
      success: true, 
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch messages' 
    }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    console.log('🔐 Checking session for chat room message POST...');
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log('❌ No session found for chat room message');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('✅ Session found for chat room message:', { userId: session.user.id, name: session.user.name });

    await connectToDatabase();

    const { id } = params;
    const { content, type, replyTo, mentions } = await request.json();
    
    console.log('📝 Chat room message data received:', { roomId: id, content: content?.substring(0, 50), type });
    
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Check if user has access to this chat room
    const chatRoom = await ChatRoom.findById(id);
    if (!chatRoom || !chatRoom.isActive) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    const hasAccess = 
      chatRoom.visibility === 'public' ||
      (chatRoom.visibility === 'college-only' && chatRoom.college?.toString() === session.user.college?.toString()) ||
      chatRoom.participants.some(p => p.user.toString() === session.user._id.toString()) ||
      chatRoom.createdBy.toString() === session.user._id.toString() ||
      session.user.role === 'admin';

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create message
    const message = new Message({
      chatRoom: id,
      sender: session.user._id,
      content: content.trim(),
      type: type || 'text',
      replyTo: replyTo || null,
      mentions: mentions || []
    });

    await message.save();

    // Update chat room last activity
    await chatRoom.updateActivity();

    // Populate message for response
    await message.populate('sender', 'name email role');
    if (message.replyTo) {
      await message.populate('replyTo', 'content sender');
    }
    if (message.mentions.length > 0) {
      await message.populate('mentions', 'name email');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ 
      error: 'Failed to send message' 
    }, { status: 500 });
  }
}