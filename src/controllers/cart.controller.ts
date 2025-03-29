import { Types } from "mongoose";
import { Request, Response } from "express";
import CartModel from "../models/Cart";
import Product from "../models/Product";
import { IBaseResponse } from "../types";

export enum CartActionType {
  ADD = "add",
  UPDATE = "update",
  REMOVE = "remove",
  CLEAR = "clear",
}

const cartController = {
  getCart: async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      if (!userId) throw new Error("Permission denied!");
      const cart = await CartModel.findOne({ user: userId }).populate({
        path: "items.product",
        select: "name slug price images isActive isDeleted salePrice",
      });

      const response: IBaseResponse = {
        success: true,
        message: "Cart retrieved successfully",
        data: { items: cart || [] },
      };

      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve cart",
        error: error.message,
      });
    }
  },

  addToCart: async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      const { productId, quantity } = req.body;

      const product = await Product.findOne({
        _id: productId,
        isActive: true,
        isDeleted: false,
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
          error: "Product is not available",
        });
      }

      if (product.stock < quantity) {
        res.status(400).json({
          success: false,
          message: "Insufficient stock",
          error: "Requested quantity exceeds available stock",
        });
        return;
      }

      let cart = await CartModel.findOne({ user: userId });

      if (!cart) {
        cart = new CartModel({
          user: userId,
          items: [
            {
              product: new Types.ObjectId(productId as string),
              quantity,
              price: product.salePrice || product.price,
            },
          ],
        });
      } else {
        const existingItem = cart.items.find(
          (item) => item.product.toString() === productId
        );

        if (existingItem) {
          existingItem.quantity += quantity;
          existingItem.price = product.salePrice || product.price;
        } else {
          cart.items.push({
            product: new Types.ObjectId(productId as string) as any,
            quantity,
            price: product.salePrice || product.price,
          });
        }
      }

      await cart.save();
      await cart.populate({
        path: "items.product",
        select: "name slug price images isActive isDeleted",
      });

      const response: IBaseResponse = {
        success: true,
        message: "Item added to cart successfully",
        data: cart,
      };

      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to add item to cart",
        error: error.message,
      });
    }
  },

  updateCartItem: async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      const { productId, quantity } = req.body;

      if (quantity < 1) {
        res.status(400).json({
          success: false,
          message: "Invalid quantity",
          error: "Quantity must be greater than 0",
        });
        return;
      }

      const product = await Product.findOne({
        _id: productId,
        isActive: true,
        isDeleted: false,
      });

      if (!product) {
        res.status(404).json({
          success: false,
          message: "Product not found",
          error: "Product is not available",
        });
        return;
      }

      if (product.stock < quantity) {
        res.status(400).json({
          success: false,
          message: "Insufficient stock",
          error: "Requested quantity exceeds available stock",
        });
        return;
      }

      const cart = await CartModel.findOne({ user: userId });
      if (!cart) {
        res.status(404).json({
          success: false,
          message: "Cart not found",
          error: "Cart does not exist",
        });
        return;
      }

      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex === -1) {
        res.status(404).json({
          success: false,
          message: "Item not found in cart",
          error: "Product is not in cart",
        });
        return;
      }

      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].price = product.salePrice || product.price;

      await cart.save();
      await cart.populate({
        path: "items.product",
        select: "name slug price images isActive isDeleted",
      });

      const response: IBaseResponse = {
        success: true,
        message: "Cart item updated successfully",
        data: cart,
      };

      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to update cart item",
        error: error.message,
      });
    }
  },

  removeFromCart: async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      const { productId } = req.params;

      const cart = await CartModel.findOne({ user: userId });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
          error: "Cart does not exist",
        });
      }

      cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId
      );

      await cart.save();
      await cart.populate({
        path: "items.product",
        select: "name slug price images isActive isDeleted",
      });

      const response: IBaseResponse = {
        success: true,
        message: "Item removed from cart successfully",
        data: cart,
      };

      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to remove item from cart",
        error: error.message,
      });
    }
  },

  clearCart: async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;

      const cart = await CartModel.findOne({ user: userId });
      if (!cart) {
        res.status(404).json({
          success: false,
          message: "Cart not found",
          error: "Cart does not exist",
        });
        return;
      }

      cart.items = [];
      await cart.save();

      const response: IBaseResponse = {
        success: true,
        message: "Cart cleared successfully",
        data: cart,
      };

      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to clear cart",
        error: error.message,
      });
    }
  },

  handleCartAction: async (req: Request, res: Response) => {
    try {
      const { action, productId, quantity } = req.body;
      const userId = req.user?._id;

      switch (action) {
        case CartActionType.ADD:
          await handleAddToCart(userId, productId, quantity, res);
          return;
        case CartActionType.UPDATE:
          await handleUpdateCart(userId, productId, quantity, res);
          return;
        case CartActionType.REMOVE:
          await handleRemoveFromCart(userId, productId, res);
          return;
        case CartActionType.CLEAR:
          await handleClearCart(userId, res);
          return;
        default:
          res.status(400).json({
            success: false,
            message: "Invalid action",
            error: "Action type not supported",
          });
          return;
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Cart operation failed",
        error: error.message,
      });
    }
  },
};

async function handleAddToCart(
  userId: string,
  productId: string,
  quantity: number,
  res: Response
) {
  const product = await Product.findOne({
    _id: productId,
    isActive: true,
    isDeleted: false,
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
      error: "Product is not available",
    });
  }

  if (product.stock < quantity) {
    return res.status(400).json({
      success: false,
      message: "Insufficient stock",
      error: "Requested quantity exceeds available stock",
    });
  }

  let cart = await CartModel.findOne({ user: userId });

  if (!cart) {
    cart = new CartModel({
      user: userId,
      items: [
        {
          product: new Types.ObjectId(productId),
          quantity,
          price: product.salePrice ? product.salePrice : product.price,
        },
      ],
    });
  } else {
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = product.salePrice
        ? product.salePrice
        : product.price;
    } else {
      cart.items.push({
        product: new Types.ObjectId(productId) as any,
        quantity,
        price: product.salePrice ? product.salePrice : product.price,
      });
    }
  }

  await cart.save();
  await cart.populate({
    path: "items.product",
    select: "name slug price images isActive isDeleted",
  });

  return res.status(200).json({
    success: true,
    message: "Item added to cart successfully",
    data: cart,
  });
}

async function handleUpdateCart(
  userId: string,
  productId: string,
  quantity: number,
  res: Response
) {
  if (quantity < 1) {
    return res.status(400).json({
      success: false,
      message: "Invalid quantity",
      error: "Quantity must be greater than 0",
    });
  }

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
    isDeleted: false,
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
      error: "Product is not available",
    });
  }

  if (product.stock < quantity) {
    return res.status(400).json({
      success: false,
      message: "Insufficient stock",
      error: "Requested quantity exceeds available stock",
    });
  }

  const cart = await CartModel.findOne({ user: userId });
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: "Cart not found",
      error: "Cart does not exist",
    });
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Item not found in cart",
      error: "Product is not in cart",
    });
  }

  cart.items[itemIndex].quantity = quantity;
  cart.items[itemIndex].price = product.salePrice || product.price;

  await cart.save();
  await cart.populate({
    path: "items.product",
    select: "name slug price images isActive isDeleted",
  });

  return res.status(200).json({
    success: true,
    message: "Cart item updated successfully",
    data: cart,
  });
}

async function handleRemoveFromCart(
  userId: string,
  productId: string,
  res: Response
) {
  const cart = await CartModel.findOne({ user: userId });
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: "Cart not found",
      error: "Cart does not exist",
    });
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  await cart.save();
  await cart.populate({
    path: "items.product",
    select: "name slug price images isActive isDeleted",
  });

  return res.status(200).json({
    success: true,
    message: "Item removed from cart successfully",
    data: cart,
  });
}

async function handleClearCart(userId: string, res: Response) {
  const cart = await CartModel.findOne({ user: userId });
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: "Cart not found",
      error: "Cart does not exist",
    });
  }

  cart.items = [];
  await cart.save();

  return res.status(200).json({
    success: true,
    message: "Cart cleared successfully",
    data: cart,
  });
}

export default cartController;
