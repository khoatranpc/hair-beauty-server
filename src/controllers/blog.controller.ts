import { Request, Response } from "express";
import BlogModel from "../models/Blog";
import { IBaseResponse } from "../types";
import slugify from "slugify";
import { UserRole } from "../models/User";
import { Types } from "mongoose";

const blogController = {
  create: async (req: Request, res: Response) => {
    try {
      const { title, content, categories, tags, isPublished, seo } = req.body;
      const slug = slugify(title, { lower: true, locale: "vi" });

      const existingBlog = await BlogModel.findOne({ slug });
      if (existingBlog) {
        res.status(400).json({
          success: false,
          message: "Blog already exists",
          error: "Title must be unique",
        });
        return;
      }

      const blog = new BlogModel({
        ...req.body,
        slug,
        author: req.user?._id,
      });

      await blog.save();
      await blog.populate([
        { path: "author", select: "fullName email" },
        { path: "categories", select: "name slug" },
      ]);

      res.status(201).json({
        success: true,
        message: "Blog created successfully",
        data: blog,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to create blog",
        error: error.message,
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (updateData.title) {
        updateData.slug = slugify(updateData.title, {
          lower: true,
          locale: "vi",
        });
        const existingBlog = await BlogModel.findOne({
          $or: [
            { _id: Types.ObjectId.isValid(id) ? id : null },
            { slug: updateData.slug },
          ],
          _id: { $ne: Types.ObjectId.isValid(id) ? id : null },
        });
        if (existingBlog) {
          res.status(400).json({
            success: false,
            message: "Blog title already exists",
            error: "Title must be unique",
          });
          return;
        }
      }

      const blog = await BlogModel.findById(id);
      if (!blog) {
        res.status(404).json({
          success: false,
          message: "Blog not found",
          error: "Invalid blog ID",
        });
        return;
      }

      if (
        req.user?.role !== UserRole.ADMIN &&
        blog.author.toString() !== req.user?._id.toString()
      ) {
        res.status(403).json({
          success: false,
          message: "Forbidden",
          error: "You can only update your own blogs",
        });
        return;
      }

      Object.assign(blog, updateData);
      await blog.save();
      await blog.populate([
        { path: "author", select: "fullName email" },
        { path: "categories", select: "name slug" },
      ]);

      res.status(200).json({
        success: true,
        message: "Blog updated successfully",
        data: blog,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to update blog",
        error: error.message,
      });
    }
  },

  getAll: async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        categories,
        tag,
        isPublished,
      } = req.query;

      const conditions: any = {};

      if (search) {
        conditions.$or = [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
          { slug: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(String(search), "i")] } },
        ];
      }

      if (categories) {
        conditions.categories = Array.isArray(categories)
          ? { $in: categories }
          : { $in: String(categories).split(",") };
      }

      if (tag) {
        conditions.tags = { $in: [new RegExp(String(tag), "i")] };
      }
      if (isPublished !== undefined && req.user?.role !== "admin") {
        conditions.isPublished = true;
      } else if (req.user?.role === UserRole.ADMIN) {
        if (isPublished !== undefined) {
          conditions.isPublished = isPublished === "true";
        } else {
          delete conditions.isPublished;
        }
      }

      const skip = (Number(page) - 1) * Number(limit);
      const total = await BlogModel.countDocuments(conditions);

      const blogs = await BlogModel.find(conditions)
        .populate([
          { path: "author", select: "fullName email" },
          { path: "categories", select: "name slug" },
        ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      res.status(200).json({
        success: true,
        message: "Blogs retrieved successfully",
        data: {
          items: blogs,
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve blogs",
        error: error.message,
      });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const blog = await BlogModel.findOne({
        $or: [{ _id: Types.ObjectId.isValid(id) ? id : null }, { slug: id }],
      }).populate([
        { path: "author", select: "fullName email" },
        { path: "categories", select: "name slug" },
      ]);

      if (!blog) {
        res.status(404).json({
          success: false,
          message: "Blog not found",
          error: "Invalid blog ID",
        });
        return;
      }

      if (!blog.isPublished && req.user.role !== UserRole.ADMIN) {
        res.status(403).json({
          success: false,
          message: "Forbidden, This blog is not published",
          error: "This blog is not published",
        });
        return;
      }
      if (req.user.role !== UserRole.ADMIN) {
        await BlogModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
      }

      res.status(200).json({
        success: true,
        message: "Blog retrieved successfully",
        data: blog,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve blog",
        error: error.message,
      });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const blog = await BlogModel.findById(id);

      if (!blog) {
        res.status(404).json({
          success: false,
          message: "Blog not found",
          error: "Invalid blog ID",
        });
        return;
      }

      if (
        req.user?.role !== UserRole.ADMIN &&
        blog.author.toString() !== req.user?._id.toString()
      ) {
        res.status(403).json({
          success: false,
          message: "Forbidden",
          error: "You can only delete your own blogs",
        });
        return;
      }

      await blog.deleteOne();

      res.status(200).json({
        success: true,
        message: "Blog deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to delete blog",
        error: error.message,
      });
    }
  },
};

export default blogController;
