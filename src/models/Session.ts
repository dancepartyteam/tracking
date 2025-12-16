import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  sessionHashkey: string;
  userMacAddress: string;
  userHashkey: string;
  ipv4: string;
  ipv6?: string;
  productHashkey: string;
  environment: string;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>({
  sessionHashkey: { type: String, required: true, unique: true, index: true },
  userMacAddress: { type: String, required: true, index: true },
  userHashkey: { type: String, required: true, index: true },
  ipv4: { type: String, required: true },
  ipv6: { type: String },
  productHashkey: { type: String, required: true, index: true },
  environment: { type: String, required: true, index: true },
}, { timestamps: true });

export const Session = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
