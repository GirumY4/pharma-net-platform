// src/modules/users/user.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'warehouse_manager' | 'pharmacy';
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    passwordHash: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['admin', 'warehouse_manager', 'pharmacy'], 
      required: true 
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { 
    timestamps: true 
  }
);

// We don't hash the password in a pre-save hook here to keep things explicit 
// and avoid issues with Mongoose update operations later. We will hash it in the controller.

export const User = mongoose.model<IUser>('User', userSchema);