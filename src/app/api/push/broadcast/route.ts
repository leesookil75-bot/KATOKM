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
        const { studentIds, title, message } = body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return NextResponse.json({ error: 'Targets missing' }, { status: 400 });
        }

        await broadcastPushNotification(studentIds, {
            title: title || '공지 알림',
            body: message
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Push-Broadcast-API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
