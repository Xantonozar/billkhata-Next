import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import User from '@/models/User';
import { globalCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        console.log('🔍 GET /api/auth/me called');
        const user = await getSession(req);

        if (!user) {
            console.log('⚠️ /api/auth/me: No session found');
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        console.log('✅ /api/auth/me: Session found for user', user._id);
        return NextResponse.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            roomStatus: user.roomStatus,
            khataId: user.khataId,
            avatarUrl: user.avatarUrl,
            whatsapp: user.whatsapp,
            facebook: user.facebook
        });
    } catch (error: any) {
        console.error('❌ Get me error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

// Update profile
export async function PUT(req: NextRequest) {
    try {
        const user = await getSession(req);
        if (!user) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, avatarUrl, whatsapp, facebook } = body;

        console.log('📝 PUT /api/auth/me received:', { name, avatarUrl, whatsapp, facebook });

        // Build update object explicitly
        const updateData: Record<string, any> = {};
        if (name) updateData.name = name;
        if (avatarUrl) updateData.avatarUrl = avatarUrl;
        if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
        if (facebook !== undefined) updateData.facebook = facebook;

        console.log('📝 Update data:', updateData);

        // Perform update
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { $set: updateData },
            { new: true }
        ).select('-password');

        console.log('✅ Updated user:', updatedUser?.avatarUrl);

        if (!updatedUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Invalidate cache
        if (globalCache) {
            globalCache.delete(`user:${user._id}`);
        }

        return NextResponse.json({
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            roomStatus: updatedUser.roomStatus,
            khataId: updatedUser.khataId,
            avatarUrl: updatedUser.avatarUrl,
            whatsapp: updatedUser.whatsapp,
            facebook: updatedUser.facebook
        });
    } catch (error: any) {
        console.error('Update profile error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
