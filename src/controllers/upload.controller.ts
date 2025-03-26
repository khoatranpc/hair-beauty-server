import { Request, Response } from "express";
import cloudinary from "../utils/cloudinary";
import { IBaseResponse } from "../types";

const uploadController = {
    uploadImages: async (req: Request, res: Response) => {
        try {
            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                res.status(400).json({
                    success: false,
                    message: "No files uploaded",
                    error: "Please provide image files"
                });
                return
            }

            const uploadPromises = (req.files as Express.Multer.File[]).map(file => {
                return cloudinary.uploader.upload(
                    `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                    {
                        folder: "hair-beauty",
                        resource_type: "auto"
                    }
                );
            });

            const results = await Promise.all(uploadPromises);

            const uploadedImages = results.map(result => ({
                url: result.secure_url,
                publicId: result.public_id
            }));

            const response: IBaseResponse = {
                success: true,
                message: "Images uploaded successfully",
                data: uploadedImages
            };

            res.status(200).json(response);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: "Failed to upload images",
                error: error.message
            });
        }
    },

    deleteImage: async (req: Request, res: Response) => {
        try {
            const { publicId } = req.params;

            const result = await cloudinary.uploader.destroy(publicId);

            if (result.result !== 'ok') {
                res.status(400).json({
                    success: false,
                    message: "Failed to delete image",
                    error: "Invalid public ID"
                });
                return
            }

            const response: IBaseResponse = {
                success: true,
                message: "Image deleted successfully",
                data: result
            };

            res.status(200).json(response);
            return
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: "Failed to delete image",
                error: error.message
            });
            return
        }
    }
};

export default uploadController;