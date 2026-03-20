import { NextRequest, NextResponse } from 'next/server';
import { getAllArtworks, addArtwork, getArtworkImageUrl } from '@/lib/artworks-database';

// GET /api/artworks - Get all artworks
export async function GET() {
  try {
    const artworks = await getAllArtworks();
    
    // Convert artworks to include image URLs for frontend
    const artworksWithUrls = artworks.map(artwork => ({
      ...artwork,
      imageUrl: getArtworkImageUrl(artwork)
    }));
    
    return NextResponse.json({ artworks: artworksWithUrls }, { status: 200 });
  } catch (error) {
    console.error('Error fetching artworks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artworks' },
      { status: 500 }
    );
  }
}

// POST /api/artworks - Add new artwork
export async function POST(request: NextRequest) {
  try {
    const { dataUrl, prompt, type } = await request.json();

    // Validate required fields
    if (!dataUrl || !type) {
      return NextResponse.json(
        { error: 'dataUrl and type are required' },
        { status: 400 }
      );
    }

    // Validate type
    if (type !== 'canvas' && type !== 'generated') {
      return NextResponse.json(
        { error: 'Type must be either "canvas" or "generated"' },
        { status: 400 }
      );
    }

    // Validate data URL format
    if (!dataUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image data format' },
        { status: 400 }
      );
    }

    // Add artwork (this saves the image file and creates the database record)
    const newArtwork = await addArtwork(dataUrl, prompt, type);

    if (newArtwork) {
      // Return artwork with image URL for frontend
      const artworkWithUrl = {
        ...newArtwork,
        imageUrl: getArtworkImageUrl(newArtwork)
      };
      
      return NextResponse.json(
        { 
          message: 'Artwork saved successfully',
          artwork: artworkWithUrl
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to save artwork' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving artwork:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 