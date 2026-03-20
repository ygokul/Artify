import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CollaborativeCanvas from '@/lib/models/CollaborativeCanvas';

export async function POST(request: NextRequest) {
  try {
    const { canvasId, userId, tool } = await request.json();

    if (!canvasId || !userId || !tool) {
      return NextResponse.json({ 
        error: 'Canvas ID, user ID, and tool are required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Update the user's current tool in the collaborative canvas
    const canvas = await CollaborativeCanvas.findById(canvasId);
    
    if (!canvas) {
      return NextResponse.json({ 
        error: 'Canvas not found' 
      }, { status: 404 });
    }

    // Find the collaborator and update their current tool
    const collaboratorIndex = canvas.collaborators.findIndex(
      (collab: any) => collab.userId === userId
    );

    if (collaboratorIndex === -1) {
      return NextResponse.json({ 
        error: 'User is not a collaborator on this canvas' 
      }, { status: 403 });
    }

    // Update the collaborator's current tool
    canvas.collaborators[collaboratorIndex].currentTool = tool;
    canvas.collaborators[collaboratorIndex].lastActivity = new Date();
    
    await canvas.save();

    console.log(`Updated tool for user ${userId} on canvas ${canvasId}: ${tool}`);

    return NextResponse.json({
      success: true,
      message: 'Current tool updated successfully'
    });

  } catch (error) {
    console.error('Set current tool API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 