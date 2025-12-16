import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  productHashkey: string;
  name: string;
  code: string;
  password: string;
  token: string;
  environment: 'dev' | 'uat' | 'prod';
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  productHashkey: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true, index: true },
  password: { type: String, required: true },
  token: { type: String, required: true },
  environment: { type: String, enum: ['dev', 'uat', 'prod'], default: 'dev', index: true },
}, { timestamps: true });

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
