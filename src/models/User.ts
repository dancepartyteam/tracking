import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  userHashkey: string;
  macAddress: string;
  shardId: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  userHashkey: { type: String, required: true, unique: true, index: true },
  macAddress: { type: String, required: true, index: true },
  shardId: { type: String, required: true, default: 'MAIN_Shard' },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
