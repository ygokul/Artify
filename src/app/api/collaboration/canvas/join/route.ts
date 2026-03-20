import { NextRequest, NextResponse } from 'next/server';
import { getCanvasById, addCollaboratorToCanvas } from '@/lib/collaboration-database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { canvasId, userId, userName, userEmail } = body;

    if (!canvasId || !userId || !userName || !userEmail) {
      return NextResponse.json({ 
        error: 'Canvas ID, user ID, user name, and user email are required' 
      }, { status: 400 });
    }

    // Check if canvas exists
    const canvas = await getCanvasById(canvasId);
    if (!canvas) {
      return NextResponse.json({ 
        error: 'Canvas not found' 
      }, { status: 404 });
    }

    // Check if canvas is active
    if (!canvas.isActive) {
      return NextResponse.json({ 
        error: 'Canvas is no longer active' 
      }, { status: 400 });
    }

    // Add user as collaborator
    const success = await addCollaboratorToCanvas(canvasId, userId, userName, userEmail);
    
    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to join canvas' 
      }, { status: 500 });
    }

    // Return updated canvas
    const updatedCanvas = await getCanvasById(canvasId);

    return NextResponse.json({
      success: true,
      canvas: updatedCanvas,
    });

  } catch (error) {
    console.error('Join canvas API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 