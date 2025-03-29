import mongoose, { Document, Schema } from "mongoose";
import { Collections } from "../types/enum";

interface CartItem {
  product: Schema.Types.ObjectId | string;
  quantity: number;
  price: number;
}

export interface ICart extends Document {
  user: Schema.Types.ObjectId;
  items: CartItem[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<CartItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: Collections.products,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
});

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: Collections.users,
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
  }
);

cartSchema.index({ user: 1 });
cartSchema.index({ "items.product": 1 });

const CartModel = mongoose.model<ICart>(Collections.carts, cartSchema);

export default CartModel;
