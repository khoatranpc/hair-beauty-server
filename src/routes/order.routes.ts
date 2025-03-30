import { Router } from "express";
import orderController from "../controllers/order.controller";
import authMiddleware from "../middleware/auth.middleware";

const router = Router();

// All order routes require authentication
router.use(authMiddleware);

// Create new order
router.post("/", orderController.create);

// Get all orders with pagination and filters
router.get("/", orderController.getAll);

// Get order by ID
router.get("/:id", orderController.getById);

// Cancel order
router.delete("/:id", orderController.cancel);

export default router;
