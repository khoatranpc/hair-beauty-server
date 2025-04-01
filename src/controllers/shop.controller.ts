import { Request, Response } from "express";
import ShopModel from "../models/Shop";
import { IBaseResponse } from "../types";
import { UserRole } from "../models/User";

const shopController = {
  getShopInfo: async (_req: Request, res: Response) => {
    try {
      const shop = await ShopModel.findOne();

      const response: IBaseResponse = {
        success: true,
        message: "Shop information retrieved successfully",
        data: shop,
      };

      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve shop information",
        error: error.message,
      });
    }
  },

  createShop: async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: "Forbidden",
          error: "Only admin can create shop information",
        });
        return;
      }

      const existingShop = await ShopModel.findOne();
      if (existingShop) {
        res.status(400).json({
          success: false,
          message: "Shop already exists",
          error: "Cannot create multiple shops",
        });
        return;
      }

      const newShop = new ShopModel(req.body);
      await newShop.save();

      res.status(201).json({
        success: true,
        message: "Shop created successfully",
        data: newShop,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to create shop",
        error: error.message,
      });
    }
  },

  updateShop: async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: "Forbidden",
          error: "Only admin can update shop information",
        });
        return;
      }

      const shop = await ShopModel.findOne();
      if (!shop) {
        res.status(404).json({
          success: false,
          message: "Shop not found",
          error: "Shop must be created first",
        });
        return;
      }

      Object.assign(shop, req.body);
      await shop.save();

      res.status(201).json({
        success: true,
        message: "Shop updated successfully",
        data: shop,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to update shop",
        error: error.message,
      });
    }
  },

  deleteShop: async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: "Forbidden",
          error: "Only admin can delete shop information",
        });
        return;
      }

      const shop = await ShopModel.findOne();
      if (!shop) {
        res.status(404).json({
          success: false,
          message: "Shop not found",
          error: "Shop does not exist",
        });
        return;
      }

      await shop.deleteOne();

      res.status(201).json({
        success: true,
        message: "Shop deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to delete shop",
        error: error.message,
      });
    }
  },
};

export default shopController;
