import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { globalCache } from '@/lib/cache';

export const generateToken = (id: string) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

export const getSession = async (req: NextRequest) => {
    await connectDB();
    let token;

    const authHeader = req.headers.get('authorization');

    if (authHeader && authHeader.startsWith('Bearer')) {
        try {
            token = authHeader.split(' ')[1];
            if (!token) return null;

            if (!process.env.JWT_SECRET) {
                console.error('JWT_SECRET is not defined');
                return null;
            }

            const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

            // Try to get user from cache first (fast path)
            const cacheKey = `user:${decoded.id}`;
            const cachedUser = globalCache.getValue(cacheKey);
            if (cachedUser) {
                return cachedUser;
            }

            const user = await User.findById(decoded.id).select('-password').lean(); // Use lean for performance

            if (user) {
                globalCache.set(cacheKey, user, 60); // Cache for 60 seconds
            }

            return user;
        } catch (error) {
            console.error('Auth error:', error);
            return null;
        }
    }
    return null;
};
