import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { UserRole } from "../models/User";
import { IBaseResponse } from "../types";

const authController = {
    register: async (req: Request, res: Response) => {
        try {
            const { email, password, fullName, phone, role } = req.body;

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                res.status(400).json({
                    success: false,
                    message: "Email already exists",
                    error: "Email is already registered",
                });
                return;
            }

            const user = new User({
                email,
                password,
                fullName,
                phone,
                role: role || UserRole.CUSTOMER,
            });

            await user.save();

            const token = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET || "default_secret",
                { expiresIn: "24h" }
            );

            const response: IBaseResponse<{ token: string }> = {
                success: true,
                message: "User registered successfully",
                data: { token },
            };

            res.status(201).json(response);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: "Registration failed",
                error: error.message,
            });
        }
    },

    login: async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email });

            if (!user) {
                res.status(401).json({
                    success: false,
                    message: "Authentication failed! Invalid email or password",
                    error: "Invalid email or password",
                });
                return;
            }

            const isValidPassword = await user!.comparePassword(password);
            if (!isValidPassword) {
                res.status(401).json({
                    success: false,
                    message: "Authentication failed! Invalid email or password",
                    error: "Invalid email or password",
                });
                return;
            }

            const token = jwt.sign(
                { userId: user!._id, role: user!.role },
                process.env.JWT_SECRET || "default_secret",
                { expiresIn: "24h" }
            );

            const response: IBaseResponse<{ token: string }> = {
                success: true,
                message: "Login successful",
                data: { token },
            };

            res.status(200).json(response);
            return;
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: "Login failed",
                error: error.message,
            });
            return;
        }
    },
    getProfile: async (req: Request, res: Response) => {
        try {
            const response: IBaseResponse = {
                success: true,
                message: 'User profile retrieved successfully',
                data: req.user
            };

            res.status(200).json(response);
            return;
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve user profile',
                error: error.message
            });
            return;
        }
    }
};

export default authController;
