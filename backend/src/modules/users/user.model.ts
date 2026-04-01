// src/modules/users/user.model.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "pharmacy_manager" | "public_user";
  phoneNumber?: string;
  address?: string;
  city?: string;
  location?: { lat: Number; lng: Number } | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "pharmacy_manager", "public_user"],
      required: true,
      index: true, // Performance for RBAC queries
    },
    phoneNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true, index: true }, // Indexed for marketplace city search
    location: { type: locationSchema, default: null },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true }, // Performance for soft deletes
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

// We don't hash the password in a pre-save hook here to keep things explicit
// and avoid issues with Mongoose update operations later. We will hash it in the controller.

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;
