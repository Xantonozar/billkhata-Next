import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { generateToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { name, email, password, role } = await req.json();

        if (!name || !email || !password || !role) {
            return NextResponse.json({ message: 'Please provide all fields' }, { status: 400 });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email: email.toLowerCase() });

        if (userExists) {
            return NextResponse.json({ message: 'User already exists with this email' }, { status: 400 });
        }

        // Create user
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password,
            role,
            roomStatus: 'NoRoom'
        });

        // Generate token
        const token = generateToken(user._id.toString());

        return NextResponse.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                roomStatus: user.roomStatus,
                khataId: user.khataId
            }
        }, { status: 201 });
    } catch (error: any) {
        console.error('Signup error:', error);
        return NextResponse.json({ message: error.message || 'Server error during signup' }, { status: 500 });
    }
}
