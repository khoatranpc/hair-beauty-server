import { Router } from 'express';
import cartController from '../controllers/cart.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// RESTful endpoints
router.get('/', cartController.getCart);
router.post('/', cartController.handleCartAction);

export default router;