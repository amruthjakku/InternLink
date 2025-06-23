import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import ChatRoom from '../../../../models/ChatRoom';
import Message from '../../../../models/Message';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = params;
    
    const chatRoom = await ChatRoom.findById(id)
      .populate('createdBy', 'name email role')
      .populate('college', 'name')
      .populate('participants.user', 'name email role');

    if (!chatRoom || !chatRoom.isActive) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Check if user has access to this room
    const hasAccess = 
      chatRoom.visibility === 'public' ||
      (chatRoom.visibility === 'college-only' && chatRoom.college?._id.toString() === session.user.college?.toString()) ||
      chatRoom.participants.some(p => p.user._id.toString() === session.user._id.toString()) ||
      chatRoom.createdBy._id.toString() === session.user._id.toString() ||
      session.user.role === 'admin';

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true, 
      chatRoom: {
        ...chatRoom.toObject(),
        participantCount: chatRoom.participantCount
      }
    });

  } catch (error) {
    console.error('Error fetching chat room:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch chat room' 
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = params;
    const updates = await request.json();
    
    const chatRoom = await ChatRoom.findById(id);

    if (!chatRoom || !chatRoom.isActive) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Check if user can edit this room (creator, admin, or room admin)
    const canEdit = 
      chatRoom.createdBy.toString() === session.user._id.toString() ||
      session.user.role === 'admin' ||
      chatRoom.participants.some(p => 
        p.user.toString() === session.user._id.toString() && p.role === 'admin'
      );

    if (!canEdit) {
      return NextResponse.json({ error: 'Not authorized to edit this room' }, { status: 403 });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'settings', 'tags'];
    const updateData = {};
    
    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    const updatedRoom = await ChatRoom.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
    .populate('createdBy', 'name email role')
    .populate('college', 'name')
    .populate('participants.user', 'name email role');

    return NextResponse.json({ 
      success: true, 
      message: 'Chat room updated successfully',
      chatRoom: {
        ...updatedRoom.toObject(),
        participantCount: updatedRoom.participantCount
      }
    });

  } catch (error) {
    console.error('Error updating chat room:', error);
    return NextResponse.json({ 
      error: 'Failed to update chat room' 
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
    
    const chatRoom = await ChatRoom.findById(id);

    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Check if user can delete this room (creator or admin)
    const canDelete = 
      chatRoom.createdBy.toString() === session.user._id.toString() ||
      session.user.role === 'admin';

    if (!canDelete) {
      return NextResponse.json({ error: 'Not authorized to delete this room' }, { status: 403 });
    }

    // Soft delete the room
    chatRoom.isActive = false;
    await chatRoom.save();

    // Also soft delete all messages in this room
    await Message.updateMany(
      { chatRoom: id },
      { isDeleted: true }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Chat room deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting chat room:', error);
    return NextResponse.json({ 
      error: 'Failed to delete chat room' 
    }, { status: 500 });
  }
}