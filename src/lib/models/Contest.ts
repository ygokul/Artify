import mongoose, { Schema, Document } from 'mongoose';

export interface IContest extends Document {
  title: string;
  description: string;
  endsIn: string;
  status: 'Ongoing' | 'Completed';
  createdAt: Date;
}

const ContestSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  endsIn: {
    type: String, 
    required: true
  },
  status: {
    type: String,
    enum: ['Ongoing', 'Completed'],
    default: 'Ongoing'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Contest || mongoose.model<IContest>('Contest', ContestSchema);
