import { NextRequest, NextResponse } from 'next/server';
import { getPublicCanvases } from '@/lib/collaboration-database';

export async function GET(request: NextRequest) {
  try {
    const canvases = await getPublicCanvases();

    return NextResponse.json({
      success: true,
      canvases: canvases.map(canvas => ({
        id: canvas.id,
        name: canvas.name,
        ownerName: canvas.ownerName,
        shareCode: canvas.shareCode,
        collaboratorsCount: canvas.collaborators.length,
        lastUpdate: canvas.lastUpdate,
        isActive: canvas.isActive
      }))
    });

  } catch (error) {
    console.error('Discover canvases API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 