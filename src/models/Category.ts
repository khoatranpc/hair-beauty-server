import mongoose, { Document, Schema } from "mongoose";
import { Collections } from "../types/enum";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parentCategories: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    parentCategories: [
      {
        type: Schema.Types.ObjectId,
        ref: Collections.categories,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model<ICategory>(
  Collections.categories,
  categorySchema
);

export default Category;
