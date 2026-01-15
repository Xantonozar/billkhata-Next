import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT: Update user profile and food preferences
export async function PUT(req: NextRequest) {
    try {
        const user = await getSession(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const body = await req.json();
        const { name, whatsapp, facebook, avatarUrl, foodPreferences } = body;

        // Build update object with only provided fields
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
        if (facebook !== undefined) updateData.facebook = facebook;
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
        if (foodPreferences !== undefined) {
            updateData.foodPreferences = {
                likes: foodPreferences.likes || [],
                dislikes: foodPreferences.dislikes || [],
                avoidance: foodPreferences.avoidance || [],
                notes: foodPreferences.notes || ''
            };
        }

        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password -otp -otpExpires');

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}
