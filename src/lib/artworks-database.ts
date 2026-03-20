import { connectToDatabase } from './mongodb';
import Canvas, { ICanvas } from './models/Canvas';
import Generated, { IGenerated } from './models/Generated';
import { saveImageFile, deleteImageFile, imageFileExists } from './image-storage';

export interface Artwork {
  id: string;
  imagePath: string; // Path to image file instead of dataUrl
  dataUrl?: string; // Stored in DB, but not always fetched in lists
  prompt?: string;
  createdAt: string;
  userId?: string;
  type: 'canvas' | 'generated';
}

// Connect to MongoDB database
export async function ensureArtworkDatabaseExists(): Promise<void> {
  await connectToDatabase();
}

// Get artworks from MongoDB
export async function getArtworks(type: 'canvas' | 'generated'): Promise<Artwork[]> {
  try {
    await connectToDatabase();
    
    let artworks: any[];
    // .select helps reduce load if we don't need the full dataUrl for a list view? 
    // Actually we currently don't use pagination effectively, loading all base64s might be heavy.
    // Ideally we return the ID and then fetch the image separately.
    if (type === 'canvas') {
      artworks = await Canvas.find({}).sort({ createdAt: -1 }).lean();
    } else {
      artworks = await Generated.find({}).sort({ createdAt: -1 }).lean();
    }
    
    // Map to Artwork interface
    // Note: We are deliberately NOT checking file existence anymore since we rely on DB
    return artworks.map(artwork => ({
        id: artwork._id.toString(),
        imagePath: artwork.imagePath, // Kept for legacy
        prompt: (artwork as IGenerated).prompt,
        createdAt: artwork.createdAt.toISOString(),
        type: artwork.type
      }));
  } catch (error) {
    console.error(`Error reading ${type} artworks from MongoDB:`, error);
    return [];
  }
}

// Get all artworks from MongoDB (both canvas and generated)
export async function getAllArtworks(): Promise<Artwork[]> {
  const canvasArtworks = await getArtworks('canvas');
  const generatedArtworks = await getArtworks('generated');
  
  // Combine and sort by creation date (newest first)
  return [...canvasArtworks, ...generatedArtworks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Add new artwork to MongoDB (saves image data directly to MongoDB)
export async function addArtwork(dataUrl: string, prompt: string | undefined, type: 'canvas' | 'generated'): Promise<Artwork | null> {
  try {
    await connectToDatabase();
    
    // Legacy: We still generate a filename for backward compatibility or potential export
    // but the primary storage is now MongoDB.
    const filename = `${type}-${Date.now()}.png`; 
    
    // No longer writing to FS via saveImageFile to support serverless

    let savedArtwork: ICanvas | IGenerated;
    
    if (type === 'canvas') {
      const canvas = new Canvas({
        imagePath: filename, // Keep for reference, though not used for serving
        dataUrl: dataUrl,
        type: 'canvas'
      });
      savedArtwork = await canvas.save();
    } else {
      const generated = new Generated({
        imagePath: filename,
        dataUrl: dataUrl,
        prompt,
        type: 'generated'
      });
      savedArtwork = await generated.save();
    }

    return {
      id: savedArtwork._id.toString(),
      imagePath: savedArtwork.imagePath,
      prompt: (savedArtwork as IGenerated).prompt,
      createdAt: savedArtwork.createdAt.toISOString(),
      type: savedArtwork.type
    };
  } catch (error) {
    console.error('Error adding artwork to MongoDB:', error);
    return null;
  }
}

// Delete artwork from MongoDB (removes from MongoDB)
export async function deleteArtwork(id: string): Promise<boolean> {
  try {
    await connectToDatabase();
    
    // Try to find and delete from Canvas collection
    let artwork = await Canvas.findById(id);
    if (artwork) {
      await Canvas.findByIdAndDelete(id);
      // No longer deleting file from FS
      return true;
    }
    
    // Try to find and delete from Generated collection
    artwork = await Generated.findById(id);
    if (artwork) {
      await Generated.findByIdAndDelete(id);
      // No longer deleting file from FS
      return true;
    }
    
    return false; // Artwork not found
  } catch (error) {
    console.error('Error deleting artwork from MongoDB:', error);
    return false;
  }
}

// Find artwork by ID in MongoDB
export async function findArtworkById(id: string): Promise<Artwork | undefined> {
  try {
    await connectToDatabase();
    
    // Try Canvas first
    let artwork = await Canvas.findById(id).lean() as any;
    if (artwork) {
      return {
        id: artwork._id.toString(),
        imagePath: artwork.imagePath,
        dataUrl: artwork.dataUrl,
        createdAt: artwork.createdAt.toISOString(),
        type: artwork.type
      };
    }
    
    // Try Generated
    const generatedArtwork = await Generated.findById(id).lean() as any;
    if (generatedArtwork) {
      return {
        id: generatedArtwork._id.toString(),
        imagePath: generatedArtwork.imagePath,
        dataUrl: generatedArtwork.dataUrl,
        prompt: generatedArtwork.prompt,
        createdAt: generatedArtwork.createdAt.toISOString(),
        type: generatedArtwork.type
      };
    }
    
    return undefined;
  } catch (error) {
    console.error('Error finding artwork by ID in MongoDB:', error);
    return undefined;
  }
}

// Get artworks by user ID from MongoDB (if needed for future user-specific artworks)
export async function getArtworksByUserId(userId: string): Promise<Artwork[]> {
  // This would require adding userId field to the models
  // For now, return all artworks as the current implementation doesn't track userId
  return await getAllArtworks();
}

// Get artwork image URL for serving to frontend
export function getArtworkImageUrl(artwork: Artwork): string {
  // Use the ID to fetch the image from the database via API
  return `/api/images/${artwork.id}`;
} 