import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import adminAuthMiddleware from "../middleware/adminAuth.middleware";
import shopController from "../controllers/shop.controller";

const router = Router();

router.get("/", shopController.getShopInfo);

router.post(
  "/",
  authMiddleware,
  adminAuthMiddleware,
  shopController.createShop
);
router.put(
  "/:id",
  authMiddleware,
  adminAuthMiddleware,
  shopController.updateShop
);
export default router;
