import mongoose, { Document, Schema } from "mongoose";
import { Collections } from "../types/enum";

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  thumbnail?: string;
  description?: string;
  categories: string[];
  tags?: string[];
  isPublished: boolean;
  viewCount: number;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  publishedAt?: Date;
  author: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    title: {
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
    content: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
    },
    description: {
      type: String,
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: Collections.users,
      required: true,
    },
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: Collections.categories,
        required: true,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

blogSchema.pre("save", function (next) {
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

const BlogModel = mongoose.model<IBlog>(Collections.blogs, blogSchema);

export default BlogModel;
