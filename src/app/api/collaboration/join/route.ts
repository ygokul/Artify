import { NextRequest, NextResponse } from 'next/server';
import { joinCanvasByCode, findCanvasByShareCode } from '@/lib/collaboration-database';

export async function POST(request: NextRequest) {
  try {
    const { shareCode, userId, userName } = await request.json();

    if (!shareCode || !userId || !userName) {
      return NextResponse.json({ 
        error: 'Share code, user ID, and user name are required' 
      }, { status: 400 });
    }

    console.log(`User ${userName} attempting to join canvas with code: ${shareCode}`);

    const canvas = await joinCanvasByCode(shareCode, userId, userName);
    
    if (!canvas) {
      return NextResponse.json({ 
        error: 'Canvas not found or inactive. Please check the share code.' 
      }, { status: 404 });
    }

    console.log(`User ${userName} successfully joined canvas: ${canvas.name}`);

    return NextResponse.json({
      success: true,
      canvas,
      message: `Successfully joined canvas: ${canvas.name}`
    });

  } catch (error) {
    console.error('Join canvas API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shareCode = searchParams.get('shareCode');

    if (!shareCode) {
      return NextResponse.json({ 
        error: 'Share code is required' 
      }, { status: 400 });
    }

    const canvas = await findCanvasByShareCode(shareCode);
    
    if (!canvas) {
      return NextResponse.json({ 
        error: 'Canvas not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      canvas: {
        id: canvas.id,
        name: canvas.name,
        ownerName: canvas.ownerName,
        shareCode: canvas.shareCode,
        collaborators: canvas.collaborators.length
      }
    });

  } catch (error) {
    console.error('Get canvas info API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 