import { Request, Response } from "express";
import OrderModel, { OrderStatus } from "../models/Order";
import CartModel from "../models/Cart";
import Product from "../models/Product";
import { IBaseResponse } from "../types";

const orderController = {
  create: async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      const { shippingAddress, paymentMethod, items: selectedItems } = req.body;

      if (
        !selectedItems ||
        !Array.isArray(selectedItems) ||
        selectedItems.length === 0
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid items",
          error: "Please select items to checkout",
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

      // Filter and validate selected items
      const orderItems = cart.items.filter((item) =>
        selectedItems.some(
          (selected) =>
            selected.productId === item.product.toString() &&
            selected.quantity <= item.quantity
        )
      );

      if (orderItems.length === 0) {
        res.status(400).json({
          success: false,
          message: "Invalid items",
          error: "Selected items not found in cart",
        });
        return;
      }

      // Validate stock and calculate total
      let totalAmount = 0;
      for (const item of orderItems) {
        const selectedItem = selectedItems.find(
          (selected) => selected.productId === item.product.toString()
        );
        const product = item.product as any;

        if (!product.isActive || product.isDeleted) {
          res.status(400).json({
            success: false,
            message: "Product not available",
            error: `${product.name} is no longer available`,
          });
          return;
        }

        if (product.stock < selectedItem!.quantity) {
          res.status(400).json({
            success: false,
            message: "Insufficient stock",
            error: `Insufficient stock for ${product.name}`,
          });
          return;
        }

        totalAmount +=
          selectedItem!.quantity *
          (!!product.salePrice ? product.salePrice : product.price);
      }

      // Create order with selected items
      const order = new OrderModel({
        user: userId,
        items: orderItems.map((item) => {
          const selectedItem = selectedItems.find(
            (selected) => selected.productId === item.product.toString()
          );
          return {
            product: (item.product as any)._id,
            quantity: selectedItem!.quantity,
            price:
              (item.product as any).salePrice || (item.product as any).price,
          };
        }),
        totalAmount,
        shippingAddress,
        paymentMethod,
      });

      // Update product stock
      await Promise.all(
        orderItems.map((item) => {
          const selectedItem = selectedItems.find(
            (selected) => selected.productId === item.product.toString()
          );
          return Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -selectedItem!.quantity },
          });
        })
      );

      // Remove ordered items from cart or update quantities
      cart.items = cart.items
        .map((item) => {
          const selectedItem = selectedItems.find(
            (selected) => selected.productId === item.product.toString()
          );
          if (selectedItem) {
            if (selectedItem.quantity === item.quantity) {
              return null; // Remove item
            }
            item.quantity -= selectedItem.quantity; // Update quantity
          }
          return item;
        })
        .filter(Boolean) as any;

      await cart.save();
      await order.save();
      await order.populate({
        path: "items.product",
        select: "name slug price images",
      });

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
      const userId = req.user?._id;
      const { page = 1, limit = 10, status } = req.query;

      const query: any = { user: userId };
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
      const userId = req.user?._id;
      const { id } = req.params;

      const order = await OrderModel.findOne({
        _id: id,
        user: userId,
      }).populate({
        path: "items.product",
        select: "name slug price images",
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
};

export default orderController;
