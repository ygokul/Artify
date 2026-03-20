import { NextRequest, NextResponse } from 'next/server';
import { deleteArtwork, findArtworkById } from '@/lib/artworks-database';

// DELETE /api/artworks/[id] - Delete artwork by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Artwork ID is required' },
        { status: 400 }
      );
    }

    // Check if artwork exists
    const artwork = await findArtworkById(id);
    if (!artwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      );
    }

    // Delete artwork
    const success = await deleteArtwork(id);

    if (success) {
      return NextResponse.json(
        { message: 'Artwork deleted successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to delete artwork' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting artwork:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 