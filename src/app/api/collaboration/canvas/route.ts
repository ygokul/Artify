import { NextRequest, NextResponse } from 'next/server';
import { createCanvas } from '@/lib/collaboration-database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, ownerId, ownerName, initialData } = body;

    if (!name || !ownerId || !ownerName) {
      return NextResponse.json({ 
        error: 'Canvas name, owner ID, and owner name are required' 
      }, { status: 400 });
    }

    const canvas = await createCanvas(name, ownerId, ownerName, initialData);
    
    if (!canvas) {
      return NextResponse.json({ 
        error: 'Failed to create collaborative canvas' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      canvas,
    });

  } catch (error) {
    console.error('Create canvas API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 