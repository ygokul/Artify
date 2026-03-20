import { NextRequest, NextResponse } from 'next/server';
import { findArtworkById } from '@/lib/artworks-database';

// GET /api/images/[id] - Serve image from database (or legacy file path)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    // The "path" might be an ID or a legacy file path. 
    // Since we updated getArtworkImageUrl to send the ID, we expect an ID here.
    // However, clean filename just in case it's a direct link or legacy.
    const idOrPath = resolvedParams.path[0]; // We assume the ID is the first segment

    if (!idOrPath) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Try to find by ID in MongoDB first
    const artwork = await findArtworkById(idOrPath);

    if (!artwork || !('dataUrl' in artwork)) {
       // Fallback or 404
       // If we want to support legacy FS for local dev:
       // But keeping it simple for now as we are fixing Netlify
       return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    // @ts-ignore - we know dataUrl exists on the raw document we fetched or our interface update is pending propagation
    const dataUrl = (artwork as any).dataUrl; 

    if (!dataUrl) {
         return NextResponse.json(
        { error: 'Image data missing' },
        { status: 404 }
      );
    }

    // Parse Data URL
    // Format: data:image/png;base64,....
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
       return NextResponse.json(
        { error: 'Invalid image data' },
        { status: 500 }
      );
    }

    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    // Return the image
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    );
  }
} 