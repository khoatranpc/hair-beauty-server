import { Request, Response, NextFunction } from "express";
import { UserRole } from "../models/User";

const adminAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== UserRole.ADMIN) {
    res.status(403).json({
      success: false,
      message: "Access denied",
      error: "Admin access required",
    });
    return;
  }
  next();
};

export default adminAuthMiddleware;
