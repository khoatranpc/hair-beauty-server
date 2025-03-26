import { Router } from 'express';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import uploadRoutes from './upload.routes';

const router = Router();

const v1Router = Router();

v1Router.use('/auth', authRoutes);
v1Router.use('/categories', categoryRoutes);
v1Router.use('/products', productRoutes);
v1Router.use('/upload', uploadRoutes);

router.use('/api/v1', v1Router);

export default router;