import fs from 'fs';
import path from 'path';

const DATABASE_PATH = path.join(process.cwd(), 'database');
const IMAGES_PATH = path.join(DATABASE_PATH, 'images');
const CANVAS_IMAGES_PATH = path.join(IMAGES_PATH, 'canvas');
const GENERATED_IMAGES_PATH = path.join(IMAGES_PATH, 'generated');

// Ensure image directories exist
export function ensureImageDirectoriesExist(): void {
  const directories = [DATABASE_PATH, IMAGES_PATH, CANVAS_IMAGES_PATH, GENERATED_IMAGES_PATH];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Generate unique filename for image
export function generateImageFilename(type: 'canvas' | 'generated', extension: string = 'png'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}-${timestamp}-${random}.${extension}`;
}

// Convert base64 data URL to buffer
function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; extension: string } {
  const matches = dataUrl.match(/^data:image\/([a-zA-Z]*);base64,(.*)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid data URL format');
  }
  
  const extension = matches[1];
  const data = matches[2];
  const buffer = Buffer.from(data, 'base64');
  
  return { buffer, extension };
}

// Save base64 image data to file
export function saveImageFile(dataUrl: string, type: 'canvas' | 'generated'): string | null {
  try {
    ensureImageDirectoriesExist();
    
    const { buffer, extension } = dataUrlToBuffer(dataUrl);
    const filename = generateImageFilename(type, extension);
    const targetDir = type === 'canvas' ? CANVAS_IMAGES_PATH : GENERATED_IMAGES_PATH;
    const filePath = path.join(targetDir, filename);
    
    fs.writeFileSync(filePath, buffer);
    
    // Return relative path from database root for storage in JSON
    return path.join('images', type, filename);
  } catch (error) {
    console.error('Error saving image file:', error);
    return null;
  }
}

// Delete image file
export function deleteImageFile(relativePath: string): boolean {
  try {
    const fullPath = path.join(DATABASE_PATH, relativePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting image file:', error);
    return false;
  }
}

// Check if image file exists
export function imageFileExists(relativePath: string): boolean {
  try {
    const fullPath = path.join(DATABASE_PATH, relativePath);
    return fs.existsSync(fullPath);
  } catch (error) {
    console.error('Error checking image file:', error);
    return false;
  }
}

// Get full path to image file
export function getImageFilePath(relativePath: string): string {
  return path.join(DATABASE_PATH, relativePath);
}

// Get image file stats
export function getImageFileStats(relativePath: string): fs.Stats | null {
  try {
    const fullPath = path.join(DATABASE_PATH, relativePath);
    return fs.statSync(fullPath);
  } catch (error) {
    console.error('Error getting image file stats:', error);
    return null;
  }
}

// Clean up orphaned image files (files that exist but aren't referenced in JSON)
export function cleanupOrphanedImages(referencedPaths: string[]): number {
  let deletedCount = 0;
  
  try {
    ensureImageDirectoriesExist();
    
    const canvasFiles = fs.readdirSync(CANVAS_IMAGES_PATH)
      .map(file => path.join('images', 'canvas', file));
    
    const generatedFiles = fs.readdirSync(GENERATED_IMAGES_PATH)
      .map(file => path.join('images', 'generated', file));
    
    const allFiles = [...canvasFiles, ...generatedFiles];
    
    // Delete files that aren't referenced
    allFiles.forEach(filePath => {
      if (!referencedPaths.includes(filePath)) {
        if (deleteImageFile(filePath)) {
          deletedCount++;
        }
      }
    });
    
  } catch (error) {
    console.error('Error cleaning up orphaned images:', error);
  }
  
  return deletedCount;
} 