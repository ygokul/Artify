import mongoose, { Schema, Document } from 'mongoose';

export interface ICollaborator {
  userId: string;
  userName: string;
  email: string;
  joinedAt: Date;
  isOnline: boolean;
  currentTool?: string;
  cursorX?: number;
  cursorY?: number;
  lastActivity?: Date;
}

export interface ICollaborativeCanvas extends Document {
  _id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  shareCode: string; // Simple 6-digit code for joining
  collaborators: ICollaborator[];
  actions: any[]; // Canvas actions/drawing data
  lastUpdate: Date;
  isActive: boolean;
  isPublic: boolean; // Whether others can discover this canvas
}

const CollaboratorSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  userName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false, // Make email optional since we don't always have it
    default: ''
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  currentTool: {
    type: String,
    default: 'brush'
  },
  cursorX: {
    type: Number,
    default: 0
  },
  cursorY: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

const CollaborativeCanvasSchema: Schema = new Schema({
  name: {
    type: String,
    required: true
  },
  ownerId: {
    type: String,
    required: true,
    ref: 'User'
  },
  ownerName: {
    type: String,
    required: true
  },
  shareCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  collaborators: [CollaboratorSchema],
  actions: {
    type: [Schema.Types.Mixed],
    default: []
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  }
});

// Create indexes for better performance
CollaborativeCanvasSchema.index({ ownerId: 1 });
CollaborativeCanvasSchema.index({ 'collaborators.userId': 1 });
CollaborativeCanvasSchema.index({ lastUpdate: -1 });

export default mongoose.models.CollaborativeCanvas || mongoose.model<ICollaborativeCanvas>('CollaborativeCanvas', CollaborativeCanvasSchema); 