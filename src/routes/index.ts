import { Router } from "express";
import authRoutes from "./auth.routes";
import categoryRoutes from "./category.routes";
import productRoutes from "./product.routes";
import uploadRoutes from "./upload.routes";
import cartRoutes from "./cart.routes";
import orderRoutes from "./order.routes";
import shopRoutes from "./shop.routes";
import blogRoutes from "./blog.routes";
const router = Router();

const v1Router = Router();

v1Router.use("/auth", authRoutes);
v1Router.use("/categories", categoryRoutes);
v1Router.use("/products", productRoutes);
v1Router.use("/upload", uploadRoutes);
v1Router.use("/cart", cartRoutes);
v1Router.use("/orders", orderRoutes);
v1Router.use("/shop", shopRoutes);
v1Router.use("/blogs", blogRoutes);

router.use("/api/v1", v1Router);

export default router;
