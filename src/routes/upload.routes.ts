import { Router } from 'express';
import uploadController from '../controllers/upload.controller';
import upload from '../middleware/upload.middleware';
import authMiddleware from '../middleware/auth.middleware';
import adminAuthMiddleware from '../middleware/adminAuth.middleware';

const router = Router();

router.post('/images', 
    authMiddleware, 
    adminAuthMiddleware, 
    upload.array('images', 10),
    uploadController.uploadImages
);

router.delete('/image/:publicId', 
    authMiddleware, 
    adminAuthMiddleware, 
    uploadController.deleteImage
);

export default router;