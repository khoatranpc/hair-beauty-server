import express from "express";
import blogController from "../controllers/blog.controller";
import authMiddleware, { verifyToken } from "../middleware/auth.middleware";
import adminAuthMiddleware from "../middleware/adminAuth.middleware";

const router = express.Router();

router.get("/", blogController.getAll);
router.get("/:id", verifyToken, blogController.getById);

router.post("/", authMiddleware, adminAuthMiddleware, blogController.create);
router.put("/:id", authMiddleware, adminAuthMiddleware, blogController.update);
router.delete(
  "/:id",
  authMiddleware,
  adminAuthMiddleware,
  blogController.delete
);

export default router;
