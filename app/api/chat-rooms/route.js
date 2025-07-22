import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../lib/mongoose';
import ChatRoom from '../../../models/ChatRoom';
import User from '../../../models/User';
import College from '../../../models/College';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const visibility = searchParams.get('visibility');
    const college = searchParams.get('college');

    // Build query based on user role and filters
    let query = { isActive: true };
    
    // Add filters
    if (type) query.type = type;
    if (visibility) query.visibility = visibility;
    if (college) query.college = college;

    // Get user details to access college information
    const sessionUser = await User.findOne({
      $or: [
        { gitlabUsername: session.user.gitlabUsername },
        { email: session.user.email }
      ]
    }).populate('college');

    if (!sessionUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Role-based access control
    if (session.user.role === 'AI Developer Intern') {
      // AI Developer Interns can see public rooms and college-only rooms from their college
      query.$or = [
        { visibility: 'public' },
        { 
          visibility: 'college-only', 
          college: sessionUser.college?._id 
        },
        {
          'participants.user': sessionUser._id
        }
      ];
    } else if (session.user.role === 'Tech Lead') {
      // Tech Leads can see public rooms and college-only rooms from their college
      query.$or = [
        { visibility: 'public' },
        { 
          visibility: 'college-only', 
          college: sessionUser.college?._id 
        },
        {
          'participants.user': sessionUser._id
        }
      ];
    } else if (session.user.role === 'POC') {
      // POCs can see all rooms from their college and public rooms
      query.$or = [
        { visibility: 'public' },
        { 
          visibility: 'college-only', 
          college: sessionUser.college?._id 
        },
        {
          createdBy: sessionUser._id
        },
        {
          'participants.user': sessionUser._id
        }
      ];
    } else if (session.user.role === 'admin') {
      // Admins can see all rooms
      // No additional restrictions
    }

    const chatRooms = await ChatRoom.find(query)
      .populate('createdBy', 'name email role')
      .populate('college', 'name')
      .populate('participants.user', 'name email role')
      .sort({ lastActivity: -1 })
      .limit(50);

    return NextResponse.json({ 
      success: true, 
      chatRooms: chatRooms.map(room => ({
        ...room.toObject(),
        participantCount: room.participantCount
      }))
    });

  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch chat rooms' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Only super-mentors and admins can create chat rooms
    if (!['POC', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Not authorized to create chat rooms' }, { status: 403 });
    }

    await connectToDatabase();

    console.log('Session user:', JSON.stringify(session.user, null, 2));

    const requestBody = await request.json();
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const { 
      name, 
      description, 
      type, 
      visibility, 
      college,
      participants,
      settings,
      tags 
    } = requestBody;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json({ 
        error: 'Name and type are required' 
      }, { status: 400 });
    }

    // Get user details to access college information
    const user = await User.findOne({
      $or: [
        { gitlabUsername: session.user.gitlabUsername },
        { email: session.user.email }
      ]
    }).populate('college');

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // For POCs, ensure they can only create rooms for their college
    let roomCollege = null;
    if (visibility === 'college-only') {
      if (session.user.role === 'POC') {
        roomCollege = user.college?._id;
        if (!roomCollege) {
          return NextResponse.json({ 
            error: 'POC must have a college assigned' 
          }, { status: 400 });
        }
      } else {
        roomCollege = college;
        if (!roomCollege) {
          return NextResponse.json({ 
            error: 'College is required for college-only rooms' 
          }, { status: 400 });
        }
      }
    }

    // Create chat room
    const chatRoom = new ChatRoom({
      name: name.trim(),
      description: description?.trim() || '',
      type: type,
      visibility: visibility || 'public',
      createdBy: user._id,
      college: roomCollege,
      settings: {
        allowFileSharing: settings?.allowFileSharing ?? true,
        allowMentions: settings?.allowMentions ?? true,
        moderationEnabled: settings?.moderationEnabled ?? false,
        maxParticipants: settings?.maxParticipants ?? 100
      },
      tags: tags || [],
      participants: [{
        user: user._id,
        role: 'admin',
        joinedAt: new Date(),
        lastSeen: new Date()
      }]
    });

    // Add initial participants if provided
    if (participants && Array.isArray(participants)) {
      for (const participantId of participants) {
        if (participantId !== user._id.toString()) {
          chatRoom.participants.push({
            user: participantId,
            role: 'member',
            joinedAt: new Date(),
            lastSeen: new Date()
          });
        }
      }
    }

    await chatRoom.save();

    // Populate the created room for response
    await chatRoom.populate('createdBy', 'name email role');
    await chatRoom.populate('college', 'name');
    await chatRoom.populate('participants.user', 'name email role');

    return NextResponse.json({ 
      success: true, 
      message: 'Chat room created successfully',
      chatRoom: {
        ...chatRoom.toObject(),
        participantCount: chatRoom.participantCount
      }
    });

  } catch (error) {
    console.error('Error creating chat room:', error);
    return NextResponse.json({ 
      error: 'Failed to create chat room' 
    }, { status: 500 });
  }
}