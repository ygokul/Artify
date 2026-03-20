import { NextRequest, NextResponse } from 'next/server';
import { getUserCollaborativeCanvases } from '@/lib/collaboration-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`Getting collaboration data for user: ${userId}`);

    // Get user's collaborative canvases (simplified approach)
    const userCanvases = await getUserCollaborativeCanvases(userId);
    
    // Find current active canvas (if any) - user is online in this canvas
    const currentCanvas = userCanvases.find(canvas => 
      canvas.collaborators.some(c => c.userId === userId && c.isOnline)
    ) || null;

    console.log(`Found ${userCanvases.length} canvases for user ${userId}, current canvas: ${currentCanvas?.name || 'none'}`);

    return NextResponse.json({
      success: true,
      userCanvases,
      currentCanvas,
      // For backward compatibility with the old invitation system
      sentInvitations: [],
      receivedInvitations: [],
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Collaboration API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 