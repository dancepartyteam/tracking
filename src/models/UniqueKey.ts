import mongoose, { Document, Schema } from 'mongoose';

export interface IUniqueKey extends Document {
  keyCode: string;
  privilegeList: number;
  privilegeName?: string;
  description?: string;
  userMacAddress?: string;
  activatedAt?: Date;
  environment: 'dev' | 'uat' | 'prod';
  gameCode?: string;
  maxActivations?: number;
  activationCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const UniqueKeySchema = new Schema<IUniqueKey>({
  keyCode: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    uppercase: true
  },
  privilegeList: { 
    type: Number, 
    required: true,
    min: 0
  },
  privilegeName: { 
    type: String,
    default: ''
  },
  description: { 
    type: String,
    default: ''
  },
  userMacAddress: { 
    type: String, 
    default: null,
    index: true
  },
  activatedAt: { 
    type: Date, 
    default: null 
  },
  environment: { 
    type: String, 
    enum: ['dev', 'uat', 'prod'], 
    default: 'prod',
    index: true 
  },
  gameCode: { 
    type: String,
    default: '',
    index: true
  },
  maxActivations: {
    type: Number,
    default: 1,
    min: 1
  },
  activationCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, { 
  timestamps: true 
});

// Index for finding available keys
UniqueKeySchema.index({ environment: 1, userMacAddress: 1 });
UniqueKeySchema.index({ keyCode: 1, environment: 1 });

export const UniqueKey = mongoose.models.UniqueKey || mongoose.model<IUniqueKey>('UniqueKey', UniqueKeySchema);