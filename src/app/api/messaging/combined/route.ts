import { NextRequest, NextResponse } from 'next/server';
import { getUserConversations, getOnlineUsers, getMessagesBetweenUsers } from '@/lib/messaging-database';
import { updateUserStatus } from '@/lib/messaging-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const currentChatUserId = searchParams.get('currentChatUserId');
    const userName = searchParams.get('userName');
    const userEmail = searchParams.get('userEmail');

    console.log(`Messaging API called for user: ${userId} (${userName})`);

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Update user status to online (this replaces the separate status polling)
    if (userName && userEmail) {
      try {
        await updateUserStatus(userId, userName, userEmail, 'online');
      } catch (statusError) {
        console.error('Error updating user status:', statusError);
        // Continue even if status update fails
      }
    }

    // Get all data (these are now async functions)
    console.log('Fetching messaging data...');
    const [conversations, onlineUsers, currentChatMessages] = await Promise.all([
      getUserConversations(userId).catch(err => {
        console.error('Error getting conversations:', err);
        return [];
      }),
      getOnlineUsers().catch(err => {
        console.error('Error getting online users:', err);
        return [];
      }),
      currentChatUserId ? getMessagesBetweenUsers(userId, currentChatUserId).catch(err => {
        console.error('Error getting chat messages:', err);
        return [];
      }) : Promise.resolve([])
    ]);

    // Filter out current user from online users
    const filteredOnlineUsers = onlineUsers.filter(user => user.userId !== userId);

    // Calculate total unread messages
    const totalUnreadMessages = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

    console.log(`Messaging data loaded: ${conversations.length} conversations, ${filteredOnlineUsers.length} online users`);

    // Return everything in one response
    return NextResponse.json({
      success: true,
      data: {
        conversations,
        onlineUsers: filteredOnlineUsers,
        currentChatMessages,
        totalUnreadMessages,
        timestamp: new Date().toISOString(), // For cache busting
      }
    });

  } catch (error) {
    console.error('Combined messaging API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'updateStatus':
        const { userId, userName, userEmail, status } = data;
        await updateUserStatus(userId, userName, userEmail, status);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Combined messaging POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 