import { NextRequest, NextResponse } from 'next/server';
import { updateInvitationStatus } from '@/lib/collaboration-database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json({ 
        error: 'Invitation ID is required' 
      }, { status: 400 });
    }

    // Decline the invitation
    const success = await updateInvitationStatus(invitationId, 'declined');
    
    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to decline invitation' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error('Decline invitation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 