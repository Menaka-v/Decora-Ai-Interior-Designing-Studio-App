import mongoose, { Schema, type Document } from 'mongoose';

export interface IDesignDocument extends Document {
  userId?: string | null;
  title: string;
  originalImage: string;
  generatedImages: Array<{
    id: string;
    title: string;
    subtitle: string;
    imageUrl: string;
    palette: string[];
    highlights: string[];
    estimatedCost: string;
    isLiveAiRender: boolean;
  }>;
  selectedVariationIndex: number;
  style: string;
  styleId: string;
  roomType: string;
  customizations: {
    wallColor: string;
    wallColorName: string;
    flooring: string;
    furnitureStyle: string;
    sofaBedColor: string;
    lightingMood: string;
    decorAddons: string[];
    budgetLevel: string;
    extraInstructions: string;
  };
  tags: string[];
  isFavorite: boolean;
  createdAt: Date;
}

const variationSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    imageUrl: { type: String, required: true },
    palette: { type: [String], default: [] },
    highlights: { type: [String], default: [] },
    estimatedCost: { type: String, default: '' },
    isLiveAiRender: { type: Boolean, default: false },
    addonChecks: { type: [Schema.Types.Mixed], default: [] },
  },
  { _id: false },
);

const designSchema = new Schema<IDesignDocument>(
  {
    userId: { type: String, default: null, index: true },
    title: { type: String, required: true, trim: true },
    originalImage: { type: String, required: true },
    generatedImages: { type: [variationSchema], required: true, default: [] },
    selectedVariationIndex: { type: Number, default: 0 },
    style: { type: String, required: true },
    styleId: { type: String, required: true },
    roomType: { type: String, required: true },
    customizations: { type: Schema.Types.Mixed, required: true },
    tags: { type: [String], default: [] },
    isFavorite: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const DesignModel =
  mongoose.models.Design || mongoose.model<IDesignDocument>('Design', designSchema);
