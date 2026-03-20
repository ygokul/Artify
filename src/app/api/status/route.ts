import { NextRequest, NextResponse } from 'next/server';
import { updateUserStatus, getOnlineUsers, getAllUserStatuses, cleanupOfflineUsers } from '@/lib/messaging-database';

// POST /api/status - Update user status
export async function POST(request: NextRequest) {
  try {
    const { userId, userName, email, status } = await request.json();

    // Validate required fields
    if (!userId || !userName || !email || !status) {
      return NextResponse.json(
        { error: 'All fields are required: userId, userName, email, status' },
        { status: 400 }
      );
    }

    // Validate status value
    if (status !== 'online' && status !== 'offline') {
      return NextResponse.json(
        { error: 'Status must be either "online" or "offline"' },
        { status: 400 }
      );
    }

    // Update user status
    const success = await updateUserStatus(userId, userName, email, status);

    if (success) {
      // Clean up old offline users
      await cleanupOfflineUsers();

      return NextResponse.json(
        { message: 'Status updated successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/status - Get user statuses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const onlineOnly = searchParams.get('onlineOnly') === 'true';

    // Clean up old offline users before returning status
    await cleanupOfflineUsers();

    const statuses = onlineOnly ? await getOnlineUsers() : await getAllUserStatuses();

    return NextResponse.json(
      { statuses },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 