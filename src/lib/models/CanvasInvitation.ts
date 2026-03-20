import mongoose, { Schema, Document } from 'mongoose';

export interface ICanvasInvitation extends Document {
  _id: string;
  canvasId: string;
  canvasName: string;
  inviterId: string;
  inviterName: string;
  inviteeId: string;
  inviteeName: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  respondedAt?: Date;
}

const CanvasInvitationSchema: Schema = new Schema({
  canvasId: {
    type: String,
    required: true,
    ref: 'CollaborativeCanvas'
  },
  canvasName: {
    type: String,
    required: true
  },
  inviterId: {
    type: String,
    required: true,
    ref: 'User'
  },
  inviterName: {
    type: String,
    required: true
  },
  inviteeId: {
    type: String,
    required: true,
    ref: 'User'
  },
  inviteeName: {
    type: String,
    required: true
  },
  inviteeEmail: {
    type: String,
    required: false, // Make email optional since we don't always have it
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  }
});

// Create indexes for better performance
CanvasInvitationSchema.index({ inviteeId: 1, status: 1 });
CanvasInvitationSchema.index({ canvasId: 1 });
CanvasInvitationSchema.index({ createdAt: -1 });

export default mongoose.models.CanvasInvitation || mongoose.model<ICanvasInvitation>('CanvasInvitation', CanvasInvitationSchema); 