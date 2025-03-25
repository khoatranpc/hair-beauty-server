import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface JwtPayload {
    userId: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Authentication failed',
                error: 'No token provided'
            });
            return
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as JwtPayload;
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Authentication failed',
                error: 'User not found'
            });
            return
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Authentication failed',
            error: 'Invalid token'
        });
        return
    }
};

export default authMiddleware;