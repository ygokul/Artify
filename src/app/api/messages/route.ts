import { NextRequest, NextResponse } from 'next/server';
import { addMessage, getUserConversations } from '@/lib/messaging-database';

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const { senderId, senderName, receiverId, receiverName, content } = await request.json();

    // Validate required fields
    if (!senderId || !senderName || !receiverId || !receiverName || !content) {
      return NextResponse.json(
        { error: 'All fields are required: senderId, senderName, receiverId, receiverName, content' },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content cannot be empty' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Message content cannot exceed 1000 characters' },
        { status: 400 }
      );
    }

    // Add message to database
    const newMessage = await addMessage({
      senderId,
      senderName,
      receiverId,
      receiverName,
      content: content.trim(),
    });

    if (newMessage) {
      return NextResponse.json(
        { 
          message: 'Message sent successfully',
          data: newMessage
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/messages?userId=xxx - Get conversations for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    const conversations = await getUserConversations(userId);

    return NextResponse.json(
      { conversations },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 