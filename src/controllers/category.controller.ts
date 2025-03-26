import { Request, Response } from "express";
import Category from "../models/Category";
import { IBaseResponse } from "../types";
import slugify from "slugify";

const categoryController = {
  create: async (req: Request, res: Response) => {
    try {
      const { name, slug, description, parentCategories } = req.body;

      const existingCategory = await Category.findOne({ slug });
      if (existingCategory) {
        res.status(400).json({
          success: false,
          message: "Category already exists",
          error: "Slug must be unique",
        });
        return;
      }

      const category = new Category({
        name,
        slug,
        description,
        parentCategories,
      });

      await category.save();

      const response: IBaseResponse = {
        success: true,
        message: "Category created successfully",
        data: category,
      };

      res.status(201).json(response);
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to create category",
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
        const existingCategory = await Category.findOne({
          slug: updateData.slug,
          _id: { $ne: id },
        });
        if (existingCategory) {
          res.status(400).json({
            success: false,
            message: "Category already exists",
            error: "Slug must be unique",
          });
          return;
        }
      }

      const category = await Category.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      if (!category) {
        res.status(404).json({
          success: false,
          message: "Category not found",
          error: "Invalid category ID",
        });
        return;
      }

      const response: IBaseResponse = {
        success: true,
        message: "Category updated successfully",
        data: category,
      };

      res.status(200).json(response);
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to update category",
        error: error.message,
      });
      return;
    }
  },

  getAll: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, search, isActive, isGetAll } = req.query;

      const conditions: any = {};
      if (search) {
        conditions.$or = [
          {
            name: { $regex: search, $options: "i" },
          },
          {
            slug: {
              $regex: slugify(String(search), { lower: true, locale: "vi" }),
              $options: "i",
            },
          },
        ];
      }
      if (isActive !== undefined) conditions.isActive = isActive === "true";

      let categories;
      let total = 0;
      let response: IBaseResponse;

      if (isGetAll === "true") {
        categories = await Category.find(conditions)
          .populate("parentCategories", "name slug")
          .sort({ createdAt: -1 });

        response = {
          success: true,
          message: "Categories retrieved successfully",
          data: categories,
        };
      } else {
        const skip = (Number(page) - 1) * Number(limit);
        total = await Category.countDocuments(conditions);

        categories = await Category.find(conditions)
          .populate("parentCategories", "name slug")
          .skip(skip)
          .limit(Number(limit))
          .sort({ createdAt: -1 });

        response = {
          success: true,
          message: "Categories retrieved successfully",
          data: {
            items: categories,
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
        message: "Failed to retrieve categories",
        error: error.message,
      });
      return;
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const category = await Category.findById(id).populate(
        "parentCategories",
        "name slug"
      );

      if (!category) {
        res.status(404).json({
          success: false,
          message: "Category not found",
          error: "Invalid category ID",
        });
        return;
      }

      const response: IBaseResponse = {
        success: true,
        message: "Category retrieved successfully",
        data: category,
      };

      res.status(200).json(response);
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve category",
        error: error.message,
      });
      return;
    }
  },
};

export default categoryController;
