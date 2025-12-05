import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';

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
            const user = await User.findById(decoded.id).select('-password');
            return user;
        } catch (error) {
            console.error('Auth error:', error);
            return null;
        }
    }
    return null;
};
