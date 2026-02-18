import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const academyId = session.user.id;

        const { passcode } = await request.json();
        const client = await db.connect();

        // 1. Find Student by Passcode AND Academy ID
        const { rows } = await client.sql`
      SELECT * FROM students 
      WHERE passcode = ${passcode} AND academy_id = ${academyId} 
      LIMIT 1;
    `;

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        const student = rows[0];
        // Generate KST date (UTC+9)
        const now = new Date();
        const kstOffset = 9 * 60 * 60 * 1000;
        const kstDate = new Date(now.getTime() + kstOffset);
        const today = kstDate.toISOString().split('T')[0];

        // 2. Mark Attendance
        const status = '출석';

        await client.sql`
      INSERT INTO attendance (student_id, date, status)
      VALUES (${student.id}, ${today}, ${status})
      ON CONFLICT (student_id, date) 
      DO UPDATE SET status = ${status}, created_at = CURRENT_TIMESTAMP;
    `;

        // 3. Mock SMS Sending
        console.log(`[SMS-MOCK] Sending to ${student.parent_phone}: ${student.name} 학생이 등원하였습니다.`);

        // 4. Push Notification
        try {
            const { sendPushNotification } = await import('@/lib/push');
            await sendPushNotification(student.id, {
                title: '출결 알림',
                body: `${student.name} 학생이 출석했습니다.`
            });
        } catch (pushErr) {
            console.error('[Push-Kiosk] Failed:', pushErr);
        }

        return NextResponse.json({
            success: true,
            student: { name: student.name, parentPhone: student.parent_phone }
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}
