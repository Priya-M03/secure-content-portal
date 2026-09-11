import mongoose, { Document, Schema } from "mongoose";

export type ContentType = "VIDEO" | "PDF" | "HTML";

export interface IContent extends Document {
  title: string;
  description?: string;
  category?: string;
  tag?: string;
  type: ContentType;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const contentSchema = new Schema<IContent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    category: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    tag: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    type: {
      type: String,
      enum: ["VIDEO", "PDF", "HTML"],
      required: true,
    },

    originalName: {
      type: String,
      required: true,
    },

    storedName: {
      type: String,
      required: true,
      unique: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },

    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IContent>("Content", contentSchema);