import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

// API v1 routes
const v1Router = Router();

// Mount all routes
v1Router.use('/auth', authRoutes);

// Mount v1 router to /api/v1
router.use('/api/v1', v1Router);

export default router;