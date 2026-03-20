import mongoose, { Schema, Document } from 'mongoose';

export interface IUserStatus extends Document {
  userId: string;
  userName: string;
  email: string;
  status: 'online' | 'offline';
  lastSeen: Date;
}

const UserStatusSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User'
  },
  userName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for better performance (removed duplicate userId index)
UserStatusSchema.index({ status: 1 });

export default mongoose.models.UserStatus || mongoose.model<IUserStatus>('UserStatus', UserStatusSchema); 