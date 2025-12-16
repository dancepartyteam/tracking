import mongoose from 'mongoose';
import { createLogger } from '../utils/logger';

const logger = createLogger('database');

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wii_tracking';
    await mongoose.connect(mongoUri);
    logger.info('MongoDB connected successfully');
  } catch (error: any) {
    logger.error('MongoDB connection error: ' + error.message);
    process.exit(1);
  }
};