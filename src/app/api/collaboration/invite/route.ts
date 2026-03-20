import { NextRequest, NextResponse } from 'next/server';
import { createInvitation } from '@/lib/collaboration-database';
import { addMessage } from '@/lib/messaging-database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { canvasId, canvasName, fromUserId, fromUserName, toUserId, toUserName } = body;

    console.log('Invitation API called with:', {
      canvasId, canvasName, fromUserId, fromUserName, toUserId, toUserName
    });

    if (!canvasId || !canvasName || !fromUserId || !fromUserName || !toUserId || !toUserName) {
      console.error('Missing required invitation fields:', body);
      return NextResponse.json({ 
        error: 'All invitation fields are required' 
      }, { status: 400 });
    }

    console.log('Creating invitation record...');
    // Create the invitation record
    const invitation = await createInvitation(canvasId, canvasName, fromUserId, fromUserName, toUserId, toUserName);
    
    if (!invitation) {
      console.error('Failed to create invitation record');
      return NextResponse.json({ 
        error: 'Failed to create invitation' 
      }, { status: 500 });
    }

    console.log('Invitation created successfully:', invitation.id);

    // Send invitation message through the messaging system
    const invitationMessage = {
      senderId: fromUserId,
      senderName: fromUserName,
      receiverId: toUserId,
      receiverName: toUserName,
      content: `🎨 Canvas Collaboration Invite: "${canvasName}"\n\nYou've been invited to collaborate on a canvas! Click here to join and start drawing together.\n\nInvitation ID: ${invitation.id}`,
    };

    console.log('Sending invitation message...');
    const message = await addMessage(invitationMessage);
    
    if (!message) {
      console.error('Failed to send invitation message');
      return NextResponse.json({ 
        error: 'Failed to send invitation message' 
      }, { status: 500 });
    }

    console.log('Invitation message sent successfully');

    return NextResponse.json({
      success: true,
      invitation,
      message,
    });

  } catch (error) {
    console.error('Send invitation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 