import mongoose, { Schema, type Document } from 'mongoose';

export interface IConsultationDocument extends Document {
  userId?: string | null;
  designerId: string;
  designerName: string;
  name: string;
  email: string;
  phone: string;
  roomType: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  referenceCode: string;
  createdAt: Date;
}

const consultationSchema = new Schema<IConsultationDocument>(
  {
    userId: { type: String, default: null, index: true },
    designerId: { type: String, required: true },
    designerName: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    roomType: { type: String, required: true },
    preferredDate: { type: String, required: true },
    preferredTime: { type: String, required: true },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    referenceCode: { type: String, required: true, unique: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const ConsultationModel =
  mongoose.models.Consultation ||
  mongoose.model<IConsultationDocument>('Consultation', consultationSchema);
