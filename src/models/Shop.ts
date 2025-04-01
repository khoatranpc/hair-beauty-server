import mongoose, { Document, Schema } from "mongoose";
import { Collections } from "../types/enum";

interface SocialMedia {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
}

interface BusinessHours {
  open: string;
  close: string;
  isOpen: boolean;
}

export interface IShop extends Document {
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  address: string;
  phone: string;
  email: string;
  socialMedia?: SocialMedia;
  businessHours: BusinessHours;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const shopSchema = new Schema<IShop>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
    },
    banner: {
      type: String,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    socialMedia: {
      facebook: String,
      instagram: String,
      tiktok: String,
      youtube: String,
    },
    businessHours: {
      open: {
        type: String,
        required: true,
      },
      close: {
        type: String,
        required: true,
      },
      isOpen: {
        type: Boolean,
        default: true,
      },
    },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one shop document exists
shopSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await (this.constructor as any).model(Collections.shops).countDocuments();
    if (count > 0) {
      const error = new Error('Only one shop document can exist');
      next(error);
      return;
    }
  }
  next();
});

const ShopModel = mongoose.model<IShop>(Collections.shops, shopSchema);

export default ShopModel;