import mongoose, { Schema, Document } from 'mongoose';

export interface IGenerated extends Document {
  _id: string;
  imagePath: string;
  dataUrl: string;
  prompt: string;
  createdAt: Date;
  type: 'generated';
}

const GeneratedSchema: Schema = new Schema({
  imagePath: {
    type: String,
    required: false
  },
  dataUrl: {
      type: String,
      required: true
  },
  prompt: {
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
    default: 'generated'
  }
});

// Create indexes for better performance
GeneratedSchema.index({ createdAt: -1 });
GeneratedSchema.index({ prompt: 'text' }); // Text search on prompts

export default mongoose.models.Generated || mongoose.model<IGenerated>('Generated', GeneratedSchema); 