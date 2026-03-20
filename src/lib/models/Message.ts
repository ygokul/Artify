import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  _id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

const MessageSchema: Schema = new Schema({
  senderId: {
    type: String,
    required: true,
    ref: 'User'
  },
  senderName: {
    type: String,
    required: true
  },
  receiverId: {
    type: String,
    required: true,
    ref: 'User'
  },
  receiverName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
});

// Create indexes for better performance
MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ timestamp: -1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema); 