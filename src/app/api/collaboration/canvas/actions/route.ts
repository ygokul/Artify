import { NextRequest, NextResponse } from 'next/server';
import { addCanvasAction, getCanvasActions } from '@/lib/collaboration-database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { canvasId, type, data, userId, userName } = body;

    if (!canvasId || !type || !userId || !userName) {
      return NextResponse.json({ 
        error: 'Canvas ID, action type, user ID, and user name are required' 
      }, { status: 400 });
    }

    const action = await addCanvasAction(canvasId, {
      type,
      data: data || {},
      userId,
      userName,
    });
    
    if (!action) {
      return NextResponse.json({ 
        error: 'Failed to add canvas action' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      action,
    });

  } catch (error) {
    console.error('Canvas action API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const canvasId = searchParams.get('canvasId');
    const since = searchParams.get('since');

    if (!canvasId) {
      return NextResponse.json({ 
        error: 'Canvas ID is required' 
      }, { status: 400 });
    }

    const actions = await getCanvasActions(canvasId, since || undefined);

    return NextResponse.json({
      success: true,
      actions,
    });

  } catch (error) {
    console.error('Get canvas actions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 