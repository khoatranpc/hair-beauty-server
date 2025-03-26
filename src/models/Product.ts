import mongoose, { Document, Schema } from 'mongoose';
import { Collections } from '../types/enum';

export interface IProduct extends Document {
    name: string;
    slug: string;
    description?: string;
    price: number;
    salePrice?: number;
    images: string[];
    categories: Schema.Types.ObjectId;
    stock: number;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    salePrice: {
        type: Number,
        min: 0
    },
    images: [{
        type: String
    }],
    categories: [{
        type: Schema.Types.ObjectId,
        ref: Collections.categories,
    }],
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

productSchema.index({ slug: 1 });
productSchema.index({ categories: 1 });
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model<IProduct>(Collections.products, productSchema);

export default Product;