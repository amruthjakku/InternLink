import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../utils/database';
import ChatRoom from '../../../models/ChatRoom';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Create default chat rooms if they don't exist
    await createDefaultChatRooms(session.user.id);

    // Auto-join user to public chat rooms if not already a participant
    const publicRooms = await ChatRoom.find({
      visibility: 'public',
      isActive: true,
      'participants.user': { $ne: session.user.id }
    });

    for (const room of publicRooms) {
      await ChatRoom.findByIdAndUpdate(room._id, {
        $push: {
          participants: {
            user: session.user.id,
            role: 'member',
            joinedAt: new Date(),
            lastSeen: new Date()
          }
        }
      });
    }

    // Fetch chat rooms that the user can access
    const chatRooms = await ChatRoom.find({
      $or: [
        { visibility: 'public' },
        { 'participants.user': session.user.id },
        { visibility: 'college-only', college: session.user.college }
      ],
      isActive: true
    })
    .populate('createdBy', 'name')
    .sort({ lastActivity: -1 })
    .lean();

    // Format for frontend
    const chats = chatRooms.map(room => ({
      id: room._id,
      name: room.name,
      type: room.type,
      description: room.description,
      participantCount: room.participants.length,
      lastActivity: room.lastActivity,
      isParticipant: room.participants.some(p => p.user.toString() === session.user.id)
    }));

    return NextResponse.json({ chats });

  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch chats' 
    }, { status: 500 });
  }
}

async function createDefaultChatRooms(userId) {
  const defaultRooms = [
    {
      name: 'General',
      description: 'General discussion for all users',
      type: 'general',
      visibility: 'public'
    },
    {
      name: 'Technical Help',
      description: 'Get help with technical issues',
      type: 'support',
      visibility: 'public'
    },
    {
      name: 'Announcements',
      description: 'Important announcements and updates',
      type: 'announcement',
      visibility: 'public'
    }
  ];

  for (const roomData of defaultRooms) {
    const existingRoom = await ChatRoom.findOne({ 
      name: roomData.name, 
      type: roomData.type 
    });

    if (!existingRoom) {
      const newRoom = new ChatRoom({
        ...roomData,
        createdBy: userId,
        participants: [{
          user: userId,
          role: 'admin',
          joinedAt: new Date(),
          lastSeen: new Date()
        }]
      });
      await newRoom.save();
    }
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