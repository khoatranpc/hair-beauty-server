import { Router } from "express";
import categoryController from "../controllers/category.controller";
import authMiddleware from "../middleware/auth.middleware";
import adminAuthMiddleware from "../middleware/adminAuth.middleware";

const router = Router();

// Public routes
router.get("/", categoryController.getAll);
router.get("/:id", categoryController.getById);

// Admin only routes
router.post(
  "/",
  authMiddleware,
  adminAuthMiddleware,
  categoryController.create
);
router.put(
  "/:id",
  authMiddleware,
  adminAuthMiddleware,
  categoryController.update
);

export default router;
