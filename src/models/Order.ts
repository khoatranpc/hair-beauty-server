import mongoose, { Document, Schema } from "mongoose";
import { Collections } from "../types/enum";

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  SHIPPING = "shipping",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export enum PaymentMethod {
  COD = "cod",
  BANKING = "banking",
  SHIP = "ship",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
}

interface OrderItem {
  product: Schema.Types.ObjectId;
  quantity: number;
  price: number;
}

interface OrderHistory {
  status: OrderStatus;
  note?: string;
  updatedBy: Schema.Types.ObjectId;
  updatedAt: Date;
}

export interface IOrder extends Document {
  user: Schema.Types.ObjectId;
  orderCode: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    note?: string;
  };
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  history?: OrderHistory[];
  updateStatus: (
    newStatus: OrderStatus,
    updatedBy: Schema.Types.ObjectId,
    note?: string
  ) => Promise<IOrder>;
}

const orderItemSchema = new Schema<OrderItem>({
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

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: Collections.users,
      required: true,
    },
    orderCode: {
      type: String,
      unique: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      fullName: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      email: { type: String, required: true, trim: true },
      note: String,
    },
    status: {
      type: String,
      enum: OrderStatus,
      default: OrderStatus.PENDING,
    },
    paymentMethod: {
      type: String,
      enum: PaymentMethod,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: PaymentStatus,
      default: PaymentStatus.PENDING,
    },
    history: [
      {
        status: {
          type: String,
          enum: OrderStatus,
          required: true,
        },
        note: String,
        updatedBy: {
          type: Schema.Types.ObjectId,
          ref: Collections.users,
          required: true,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add pre-save middleware to track status changes
orderSchema.pre("save", async function (next) {
  // Generate order code for new order
  if (!this.orderCode) {
    const date = new Date();
    const prefix = "HD";
    const timestamp = date.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    this.orderCode = `${prefix}${timestamp}${random}`;
  }
  next();
});

orderSchema.methods.updateStatus = function (
  newStatus: OrderStatus,
  updatedBy: Schema.Types.ObjectId,
  note?: string
) {
  this.status = newStatus;
  if (!this.history) {
    this.history = [];
  }
  this.history.push({
    status: newStatus,
    updatedBy,
    note,
    updatedAt: new Date(),
  });
  return this.save();
};

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

const OrderModel = mongoose.model<IOrder>(Collections.orders, orderSchema);

export default OrderModel;
