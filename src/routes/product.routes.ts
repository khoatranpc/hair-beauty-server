import { Router } from "express";
import productController from "../controllers/product.controller";
import authMiddleware from "../middleware/auth.middleware";
import adminAuthMiddleware from "../middleware/adminAuth.middleware";

const router = Router();

// Public routes
router.get("/", productController.getAll);
router.get("/:id", productController.getById);

// Admin only routes
router.post("/", authMiddleware, adminAuthMiddleware, productController.create);
router.put(
  "/:id",
  authMiddleware,
  adminAuthMiddleware,
  productController.update
);
router.delete(
  "/:id",
  authMiddleware,
  adminAuthMiddleware,
  productController.delete
);

export default router;
