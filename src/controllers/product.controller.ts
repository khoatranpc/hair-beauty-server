import { Request, Response } from "express";
import Product from "../models/Product";
import { IBaseResponse } from "../types";
import slugify from "slugify";
import { Types } from "mongoose";
import User, { UserRole } from "../models/User";

const productController = {
  create: async (req: Request, res: Response) => {
    try {
      const {
        name,
        slug,
        description,
        price,
        salePrice,
        images,
        categories,
        stock,
      } = req.body;

      const existingProduct = await Product.findOne({ slug });
      if (existingProduct) {
        res.status(400).json({
          success: false,
          message: "Product already exists",
          error: "Slug must be unique",
        });
        return;
      }

      const product = new Product({
        name,
        slug: slugify(name, {
          lower: true,
          locale: "vi",
        }),
        description,
        price,
        salePrice,
        images,
        categories: categories.map((item: string) => new Types.ObjectId(item)),
        stock,
      });

      await product.save();

      const response: IBaseResponse = {
        success: true,
        message: "Product created successfully",
        data: product,
      };

      res.status(201).json(response);
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to create product",
        error: error.message,
      });
      return;
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (updateData.slug) {
        const existingProduct = await Product.findOne({
          slug: updateData.slug,
          _id: { $ne: id },
        });
        if (existingProduct) {
          res.status(400).json({
            success: false,
            message: "Product already exists",
            error: "Slug must be unique",
          });
          return;
        }
      }

      const product = await Product.findByIdAndUpdate(id, updateData, {
        new: true,
      }).populate("categories", "name slug");

      if (!product) {
        res.status(404).json({
          success: false,
          message: "Product not found",
          error: "Invalid product ID",
        });
        return;
      }

      const response: IBaseResponse = {
        success: true,
        message: "Product updated successfully",
        data: product,
      };

      res.status(200).json(response);
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to update product",
        error: error.message,
      });
      return;
    }
  },

  getAll: async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        categories,
        isActive,
        isGetAll,
        minPrice,
        maxPrice,
      } = req.query;

      const conditions: any = {
        isDeleted: req.user?.role === UserRole.CUSTOMER,
      };

      if (search) {
        conditions.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          {
            slug: {
              $regex: slugify(String(search), { lower: true, locale: "vi" }),
              $options: "i",
            },
          },
        ];
      }

      if (categories) {
        const categoryArray = Array.isArray(categories)
          ? categories
          : categories.toString().split(",");
        conditions.categories = {
          $in: categoryArray.map((cat) => new Types.ObjectId(cat as string)),
        };
      }
      if (isActive !== undefined) conditions.isActive = isActive === "true";

      if (minPrice !== undefined || maxPrice !== undefined) {
        conditions.price = {};
        if (minPrice !== undefined) conditions.price.$gte = Number(minPrice);
        if (maxPrice !== undefined) conditions.price.$lte = Number(maxPrice);
      }

      let products;
      let response: IBaseResponse;

      if (isGetAll === "true") {
        products = await Product.find(conditions)
          .populate("categories", "name slug")
          .sort({ createdAt: -1 });

        response = {
          success: true,
          message: "Products retrieved successfully",
          data: products,
        };
      } else {
        const skip = (Number(page) - 1) * Number(limit);
        const total = await Product.countDocuments(conditions);

        products = await Product.find(conditions)
          .populate("categories", "name slug")
          .skip(skip)
          .limit(Number(limit))
          .sort({ createdAt: -1 });

        response = {
          success: true,
          message: "Products retrieved successfully",
          data: {
            items: products,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
          },
        };
      }

      res.status(200).json(response);
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve products",
        error: error.message,
      });
      return;
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const query = {
        ...(Types.ObjectId.isValid(id)
          ? {
              _id: id,
            }
          : { slug: id }),
        ...(req.user?.role === UserRole.CUSTOMER
          ? {
              isDeleted: false,
            }
          : {}),
      };
      const product = await Product.findOne(query).populate(
        "categories",
        "name slug"
      );

      if (!product) {
        res.status(404).json({
          success: false,
          message: "Product not found",
          error: "Invalid product ID",
        });
        return;
      }

      const response: IBaseResponse = {
        success: true,
        message: "Product retrieved successfully",
        data: product,
      };

      res.status(200).json(response);
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve product",
        error: error.message,
      });
      return;
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const product = await Product.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
      );

      if (!product) {
        res.status(404).json({
          success: false,
          message: "Product not found",
          error: "Invalid product ID",
        });
        return;
      }

      const response: IBaseResponse = {
        success: true,
        message: "Product deleted successfully",
        data: product,
      };

      res.status(200).json(response);
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to delete product",
        error: error.message,
      });
      return;
    }
  },
};

export default productController;
