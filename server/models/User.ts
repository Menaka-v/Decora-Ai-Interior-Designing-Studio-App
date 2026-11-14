import mongoose, { Schema, type Document } from 'mongoose';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  preferredStyle?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    preferredStyle: { type: String, default: 'modern' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const UserModel =
  mongoose.models.User || mongoose.model<IUserDocument>('User', userSchema);
