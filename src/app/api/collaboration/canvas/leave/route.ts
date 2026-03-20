import { NextRequest, NextResponse } from 'next/server';
import { removeCollaboratorFromCanvas, updateCollaboratorStatus } from '@/lib/collaboration-database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { canvasId, userId } = body;

    if (!canvasId || !userId) {
      return NextResponse.json({ 
        error: 'Canvas ID and user ID are required' 
      }, { status: 400 });
    }

    // Set user as offline first
    await updateCollaboratorStatus(canvasId, userId, { isOnline: false });
    
    // For now, just set as offline rather than removing completely
    // This preserves their history in the canvas
    const success = true; // We could implement actual removal later

    return NextResponse.json({
      success,
    });

  } catch (error) {
    console.error('Leave canvas API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 