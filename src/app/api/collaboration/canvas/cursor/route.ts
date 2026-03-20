import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CollaborativeCanvas from '@/lib/models/CollaborativeCanvas';

export async function POST(request: NextRequest) {
  try {
    const { canvasId, userId, x, y } = await request.json();

    if (!canvasId || !userId || (x === undefined || y === undefined)) {
      return NextResponse.json({ 
        error: 'Canvas ID, user ID, and cursor coordinates are required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Update the user's cursor position in the collaborative canvas
    const canvas = await CollaborativeCanvas.findById(canvasId);
    
    if (!canvas) {
      return NextResponse.json({ 
        error: 'Canvas not found' 
      }, { status: 404 });
    }

    // Find the collaborator and update their cursor position
    const collaboratorIndex = canvas.collaborators.findIndex(
      (collab: any) => collab.userId === userId
    );

    if (collaboratorIndex === -1) {
      return NextResponse.json({ 
        error: 'User is not a collaborator on this canvas' 
      }, { status: 403 });
    }

    // Update the collaborator's cursor position and last activity
    canvas.collaborators[collaboratorIndex].cursorX = x;
    canvas.collaborators[collaboratorIndex].cursorY = y;
    canvas.collaborators[collaboratorIndex].lastActivity = new Date();
    
    await canvas.save();

    // Note: In a real-time application, you might want to broadcast this to other collaborators
    // via WebSocket or Server-Sent Events instead of just saving to database

    return NextResponse.json({
      success: true,
      message: 'Cursor position updated successfully'
    });

  } catch (error) {
    console.error('Update cursor position API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 