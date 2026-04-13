import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { broadcastPushNotification } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { stopId, routeName, stopName } = await request.json();

        if (!stopId) {
            return NextResponse.json({ error: 'Missing stopId' }, { status: 400 });
        }

        const client = await db.connect();
        
        // Find all students assigned to this stop
        const { rows: assignments } = await client.sql`
            SELECT student_id 
            FROM shuttle_assignments 
            WHERE stop_id = ${stopId}
        `;

        if (assignments.length === 0) {
            return NextResponse.json({ success: true, message: 'No students assigned to this stop.' });
        }

        const studentIds = assignments.map(a => a.student_id);

        // Build localized notification message
        const title = `셔틀버스 도착 알림`;
        const body = `[${routeName}] 셔틀이 잠시 후 '${stopName}' 정류장에 도착합니다. 미리 나와주세요!`;

        // Send push to all assigned students
        const results = await broadcastPushNotification(studentIds, { title, body });

        return NextResponse.json({ 
            success: true, 
            studentsNotified: studentIds.length,
            results 
        });
    } catch (error: any) {
        console.error('[Notify-Stop-Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
