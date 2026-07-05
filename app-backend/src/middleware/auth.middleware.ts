import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }
const token = authHeader.split(' ')[1];
if (!token) {
    return res.status(401).json({ message: 'No token provided' });
}
    const JWT_SECRET = process.env.JWT_SECRET as string;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as unknown as  {
            user_id: number;
            user_role: string;
            restaurant_id: number | null;
        };

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// usage: requireRole('Admin', 'Super Admin')
export const requireRole = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        if (!allowedRoles.includes(req.user.user_role)) {
            return res.status(403).json({ message: 'Not authorized for this action' });
        }
        next();
    };
};