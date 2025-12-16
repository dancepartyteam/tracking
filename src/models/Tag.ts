import mongoose, { Document, Schema } from 'mongoose';

export interface ITag extends Document {
  name: string;
  attributes: string;
  delta: number;
  sequence: number;
  sessionHashkey: string;
  productHashkey: string;
  environment: string;
  createdAt: Date;
}

const TagSchema = new Schema<ITag>({
  name: { type: String, required: true, index: true },
  attributes: { type: String },
  delta: { type: Number },
  sequence: { type: Number, index: true },
  sessionHashkey: { type: String, required: true, index: true },
  productHashkey: { type: String, required: true, index: true },
  environment: { type: String, required: true, index: true },
}, { timestamps: true });

export const Tag = mongoose.models.Tag || mongoose.model<ITag>('Tag', TagSchema);