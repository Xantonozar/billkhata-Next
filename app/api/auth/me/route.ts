import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

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
            khataId: user.khataId
        });
    } catch (error: any) {
        console.error('❌ Get me error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
