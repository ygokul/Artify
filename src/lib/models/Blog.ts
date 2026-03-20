import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
  _id: string;
  title: string;
  content: string;
  excerpt: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  featuredImage?: string;
  images: string[]; // Array of image URLs used in the blog
  tags: string[];
  category: string;
  status: 'draft' | 'published' | 'archived';
  isPublic: boolean;
  views: number;
  likes: number;
  likedBy: string[]; // Array of user IDs who liked this blog
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

const BlogSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxlength: 300,
    default: ''
  },
  authorId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorEmail: {
    type: String,
    required: true
  },
  featuredImage: {
    type: String,
    default: ''
  },
  images: [{
    type: String
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    default: 'general',
    lowercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: String,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: {
    type: Date
  }
});

// Create indexes for better performance
BlogSchema.index({ authorId: 1, status: 1 });
BlogSchema.index({ status: 1, isPublic: 1, publishedAt: -1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ category: 1 });
BlogSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Update the updatedAt field before saving
BlogSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

export default mongoose.models.Blog || mongoose.model<IBlog>('Blog', BlogSchema); 