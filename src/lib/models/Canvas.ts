import mongoose, { Schema, Document } from 'mongoose';

export interface ICanvas extends Document {
  _id: string;
  imagePath: string;
  dataUrl: string;
  createdAt: Date;
  type: 'canvas';
}

const CanvasSchema: Schema = new Schema({
  imagePath: {
    type: String,
    required: false
  },
  dataUrl: {
      type: String,
      required: true 
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    required: true,
    default: 'canvas'
  }
});

// Create indexes for better performance
CanvasSchema.index({ createdAt: -1 });

export default mongoose.models.Canvas || mongoose.model<ICanvas>('Canvas', CanvasSchema); 