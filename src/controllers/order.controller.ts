import { Request, Response } from "express";
import OrderModel, { OrderStatus } from "../models/Order";
import CartModel from "../models/Cart";
import Product from "../models/Product";
import { IBaseResponse } from "../types";
import User, { UserRole } from "../models/User";
import { Types } from "mongoose";

const orderController = {
  create: async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      const { shippingAddress, productIds } = req.body;

      if (
        !productIds ||
        !Array.isArray(productIds) ||
        productIds.length === 0
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid products",
          error: "Please select products to checkout",
        });
        return;
      }

      const cart = await CartModel.findOne({ user: userId }).populate({
        path: "items.product",
        select: "name price stock isActive isDeleted salePrice",
      });

      if (!cart || cart.items.length === 0) {
        res.status(400).json({
          success: false,
          message: "Cart is empty",
          error: "Cannot create order with empty cart",
        });
        return;
      }

      // Filter selected items from cart

      const orderItems = cart.items.filter((item) => {
        return productIds.includes((item.product as any)._id.toString());
      });

      if (orderItems.length === 0) {
        res.status(400).json({
          success: false,
          message: "Invalid items",
          error: "Selected products not found in cart",
        });
        return;
      }

      // Validate stock and calculate total
      let totalAmount = 0;
      for (const item of orderItems) {
        const product = item.product as any;

        if (!product.isActive || product.isDeleted) {
          res.status(400).json({
            success: false,
            message: "Product not available",
            error: `${product.name} is no longer available`,
          });
          return;
        }

        if (product.stock < item.quantity) {
          res.status(400).json({
            success: false,
            message: "Insufficient stock",
            error: `Insufficient stock for ${product.name}`,
          });
          return;
        }

        totalAmount += item.quantity * (product.salePrice || product.price);
      }

      // Create order
      const order = new OrderModel({
        user: userId,
        items: orderItems.map((item) => ({
          product: (item.product as any)._id,
          quantity: item.quantity,
          price: (item.product as any).salePrice || (item.product as any).price,
        })),
        totalAmount,
        shippingAddress,
        paymentMethod: "cod", // Default to COD
      });

      // Update product stock
      await Promise.all(
        orderItems.map((item) =>
          Product.findByIdAndUpdate(
            item.product,
            {
              $inc: { stock: -item.quantity },
            },
            { new: true }
          )
        )
      );

      cart.items = cart.items.filter(
        (item) => !productIds.includes((item.product as any)._id.toString())
      );

      await cart.save();
      await order.save();
      await order.populate({
        path: "items.product",
        select: "name slug price images",
      });
      await order.updateStatus(
        OrderStatus.CONFIRMED,
        req.user._id,
        "Tạo mới đơn hàng"
      );
      const response: IBaseResponse = {
        success: true,
        message: "Order created successfully",
        data: order,
      };

      res.status(201).json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to create order",
        error: error.message,
      });
    }
  },

  getAll: async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user?._id) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
          error: "Please login to continue",
        });
        return;
      }

      const {
        page = 1,
        limit = 10,
        status,
        orderCode,
        dateRange,
        search,
      } = req.query;

      const query: any = {};

      if (user.role === UserRole.CUSTOMER) {
        query.user = user._id;
      } else {
        if (orderCode) {
          query.orderCode = { $regex: orderCode, $options: "i" };
        }

        if (search) {
          const users = await User.find({
            $or: [
              { email: { $regex: search, $options: "i" } },
              { fullName: { $regex: search, $options: "i" } },
              { phone: { $regex: search, $options: "i" } },
            ],
          }).select("_id");

          if (users.length > 0) {
            query.user = { $in: users.map((u) => u._id) };
          } else {
            query.user = null;
          }
        }

        if (Array.isArray(dateRange) && dateRange?.length) {
          query.createdAt = {
            $gte: new Date(Number(dateRange?.[0] as string)),
            $lte: new Date(Number(dateRange?.[1] as string)),
          };
        }
      }

      if (status) {
        query.status = status;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const total = await OrderModel.countDocuments(query);

      const orders = await OrderModel.find(query)
        .populate({
          path: "items.product",
          select: "name slug price images",
        })
        .populate({
          path: "user",
          select: "email fullName phone",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const response: IBaseResponse = {
        success: true,
        message: "Orders retrieved successfully",
        data: {
          items: orders,
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve orders",
        error: error.message,
      });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const order = await OrderModel.findOne({
        _id: new Types.ObjectId(id),
      }).populate({
        path: "items.product user",
        select: "name slug price images fullName phone email",
      });

      if (!order) {
        res.status(404).json({
          success: false,
          message: "Order not found",
          error: "Invalid order ID",
        });
        return;
      }

      const response: IBaseResponse = {
        success: true,
        message: "Order retrieved successfully",
        data: order,
      };

      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve order",
        error: error.message,
      });
    }
  },

  cancel: async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      const { id } = req.params;

      const order = await OrderModel.findOne({
        _id: id,
        user: userId,
      });

      if (!order) {
        res.status(404).json({
          success: false,
          message: "Order not found",
          error: "Invalid order ID",
        });
        return;
      }

      if (order.status !== OrderStatus.PENDING) {
        res.status(400).json({
          success: false,
          message: "Cannot cancel order",
          error: "Order can only be cancelled when pending",
        });
        return;
      }

      // Restore product stock
      await Promise.all(
        order.items.map((item) =>
          Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          })
        )
      );

      order.status = OrderStatus.CANCELLED;
      await order.save();
      await order.populate({
        path: "items.product",
        select: "name slug price images",
      });

      const response: IBaseResponse = {
        success: true,
        message: "Order cancelled successfully",
        data: order,
      };

      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to cancel order",
        error: error.message,
      });
    }
  },

  updateOrder: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, note } = req.body;
      const userId = req.user?._id;

      const order = await OrderModel.findById(id);
      if (!order) {
        res.status(404).json({
          success: false,
          message: "Order not found",
          error: "Invalid order ID",
        });
        return;
      }
      if (
        req.user?.role === UserRole.CUSTOMER &&
        order.user?.toString() !== userId?.toString()
      ) {
        res.status(403).json({
          success: false,
          message: "Forbidden",
          error: "You do not have permission to update this order",
        });
        return;
      }

      if (status) {
        // chỉ huỷ được khi trạng thái là đang chờ xử lý
        if (
          status === OrderStatus.CANCELLED &&
          order.status !== OrderStatus.PENDING
        ) {
          res.status(400).json({
            success: false,
            message: "Invalid status update, Orders can only be cancelled when pending",
            error: "Orders can only be cancelled when pending",
          });
          return;
        }

        // chỉ cập nhật trạng thái đã giao khi trạng thái là đang giao hàng
        if (
          status === OrderStatus.DELIVERED &&
          order.status !== OrderStatus.SHIPPING
        ) {
          res.status(400).json({
            success: false,
            message: "Invalid status update, Orders must be shipping before being marked as delivered",
            error: "Orders must be shipping before being marked as delivered",
          });
          return;
        }

        await order.updateStatus(status, userId, note);
      }

      await order.populate([
        {
          path: "items.product",
          select: "name slug price images",
        },
        {
          path: "history.updatedBy",
          select: "fullName email",
        },
      ]);

      res.status(200).json({
        success: true,
        message: "Order updated successfully",
        data: order,
      });
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to update order",
        error: error.message,
      });
      return;
    }
  },
};

export default orderController;
