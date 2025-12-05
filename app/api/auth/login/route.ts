import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { generateToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        console.log('🔍 POST /api/auth/login called');
        await connectDB();
        const { email, password } = await req.json();
        console.log('📝 Login attempt for:', email);

        if (!email || !password) {
            console.log('⚠️ Login missing fields');
            return NextResponse.json({ message: 'Please provide email and password' }, { status: 400 });
        }

        // Find user (include password for comparison)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            console.log('⚠️ Login failed: User not found');
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('⚠️ Login failed: Password mismatch');
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // Generate token
        const token = generateToken(user._id.toString());
        console.log('✅ Login successful for:', email);

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
        });
    } catch (error: any) {
        console.error('❌ Login error:', error);
        return NextResponse.json({ message: error.message || 'Server error during login' }, { status: 500 });
    }
}
