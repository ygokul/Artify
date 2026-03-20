import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubmission extends Document {
  contestId: mongoose.Types.ObjectId;
  userId: string; // Storing user ID as string for now to match current auth
  userName: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: Date;
}

const SubmissionSchema: Schema = new Schema({
  contestId: { type: Schema.Types.ObjectId, ref: 'Contest', required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Submission: Model<ISubmission> = mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);

export default Submission;
