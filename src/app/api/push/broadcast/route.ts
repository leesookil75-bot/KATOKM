import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { broadcastPushNotification } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || (session.user.role !== 'ACADEMY' && session.user.role !== 'SUPER')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { studentIds, title, message, payload } = body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return NextResponse.json({ error: 'Targets missing' }, { status: 400 });
        }

        // Handle both possible structures (direct vs nested in payload)
        const finalTitle = title || payload?.title || '학원 알림';
        const finalBody = message || payload?.body || '';

        const results = await broadcastPushNotification(studentIds, {
            title: finalTitle,
            body: finalBody
        });

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('[Push-Broadcast-API] Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
