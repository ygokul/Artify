import { NextRequest, NextResponse } from 'next/server';
import { getMessagesBetweenUsers, markMessagesAsRead } from '@/lib/messaging-database';

// GET /api/messages/[userId]?currentUserId=xxx - Get messages between current user and specified user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const currentUserId = searchParams.get('currentUserId');

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'currentUserId parameter is required' },
        { status: 400 }
      );
    }

    const messages = await getMessagesBetweenUsers(currentUserId, userId);

    return NextResponse.json(
      { messages },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/messages/[userId] - Mark messages as read
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { currentUserId } = await request.json();

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'currentUserId is required' },
        { status: 400 }
      );
    }

    // Mark messages from userId to currentUserId as read
    const success = await markMessagesAsRead(userId, currentUserId);

    if (success) {
      return NextResponse.json(
        { message: 'Messages marked as read' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to mark messages as read' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 