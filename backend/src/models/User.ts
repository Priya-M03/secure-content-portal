import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "admin" | "viewer";

export interface IUser extends Document {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
}

const userSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
    },

    role: {
      type: String,
      enum: ["admin", "viewer"],
      default: "viewer",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>("User", userSchema);