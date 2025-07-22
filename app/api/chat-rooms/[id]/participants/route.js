import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import ChatRoom from '../../../../../models/ChatRoom';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = params;
    const { participants } = await request.json();
    
    if (!participants || !Array.isArray(participants)) {
      return NextResponse.json({ 
        error: 'Participants array is required' 
      }, { status: 400 });
    }

    const chatRoom = await ChatRoom.findById(id);

    if (!chatRoom || !chatRoom.isActive) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Check if user can add participants (creator, admin, or room admin)
    const canAddParticipants = 
      chatRoom.createdBy.toString() === session.user._id.toString() ||
      session.user.role === 'admin' ||
      session.user.role === 'POC' ||
      chatRoom.participants.some(p => 
        p.user.toString() === session.user._id.toString() && p.role === 'admin'
      );

    if (!canAddParticipants) {
      return NextResponse.json({ error: 'Not authorized to add participants' }, { status: 403 });
    }

    // Add new participants
    for (const participantId of participants) {
      const existingParticipant = chatRoom.participants.find(p => 
        p.user.toString() === participantId.toString()
      );
      
      if (!existingParticipant) {
        chatRoom.participants.push({
          user: participantId,
          role: 'member',
          joinedAt: new Date(),
          lastSeen: new Date()
        });
      }
    }

    await chatRoom.save();

    // Populate the updated room for response
    await chatRoom.populate('participants.user', 'name email role');

    return NextResponse.json({ 
      success: true, 
      message: 'Participants added successfully',
      chatRoom: {
        ...chatRoom.toObject(),
        participantCount: chatRoom.participantCount
      }
    });

  } catch (error) {
    console.error('Error adding participants:', error);
    return NextResponse.json({ 
      error: 'Failed to add participants' 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = params;
    const { participantId } = await request.json();
    
    if (!participantId) {
      return NextResponse.json({ 
        error: 'Participant ID is required' 
      }, { status: 400 });
    }

    const chatRoom = await ChatRoom.findById(id);

    if (!chatRoom || !chatRoom.isActive) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Check if user can remove participants (creator, admin, or room admin)
    const canRemoveParticipants = 
      chatRoom.createdBy.toString() === session.user._id.toString() ||
      session.user.role === 'admin' ||
      session.user.role === 'POC' ||
      chatRoom.participants.some(p => 
        p.user.toString() === session.user._id.toString() && p.role === 'admin'
      ) ||
      participantId === session.user._id.toString(); // Users can remove themselves

    if (!canRemoveParticipants) {
      return NextResponse.json({ error: 'Not authorized to remove participants' }, { status: 403 });
    }

    // Remove participant
    chatRoom.participants = chatRoom.participants.filter(p => 
      p.user.toString() !== participantId.toString()
    );

    await chatRoom.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Participant removed successfully'
    });

  } catch (error) {
    console.error('Error removing participant:', error);
    return NextResponse.json({ 
      error: 'Failed to remove participant' 
    }, { status: 500 });
  }
}