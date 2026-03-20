import { NextRequest, NextResponse } from 'next/server';
import { getInvitationById, updateInvitationStatus } from '@/lib/collaboration-database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invitationId, userId } = body;

    if (!invitationId || !userId) {
      return NextResponse.json({ 
        error: 'Invitation ID and user ID are required' 
      }, { status: 400 });
    }

    // Get the invitation
    const invitation = await getInvitationById(invitationId);
    if (!invitation) {
      return NextResponse.json({ 
        error: 'Invitation not found' 
      }, { status: 404 });
    }

    // Check if invitation is for this user
    if (invitation.toUserId !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized to accept this invitation' 
      }, { status: 403 });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Invitation is no longer pending' 
      }, { status: 400 });
    }

    // Check if invitation has expired (skip for now since we don't have expiresAt properly set)
    // const now = new Date();
    // const expiresAt = new Date(invitation.expiresAt);
    // if (expiresAt < now) {
    //   await updateInvitationStatus(invitationId, 'expired');
    //   return NextResponse.json({ 
    //     error: 'Invitation has expired' 
    //   }, { status: 400 });
    // }

    // Accept the invitation
    const success = await updateInvitationStatus(invitationId, 'accepted');
    
    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to accept invitation' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      canvasId: invitation.canvasId,
      canvasName: invitation.canvasName,
    });

  } catch (error) {
    console.error('Accept invitation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 