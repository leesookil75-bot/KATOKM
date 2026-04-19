import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { studentId, stopName } = body;

        if (!studentId) {
            return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
        }

        // Fetch student info
        const { rows: studentInfo } = await sql`
            SELECT s.name, s.academy_id 
            FROM students s 
            WHERE s.id = ${studentId}
        `;

        if (studentInfo.length === 0) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        const studentName = studentInfo[0].name;
        const academyId = studentInfo[0].academy_id;

        // Create notification payload
        const timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        const messageBody = `${studentName} 학생이 승차하였습니다. (${timeString})`;

        // Send push
        const pushResult = await sendPushNotification(studentId, {
            title: '안심 셔틀 알림',
            body: messageBody
        });

        // Log the PUSH contact
        try {
            await sql`
                INSERT INTO contact_logs (student_id, academy_id, contact_type, action_status)
                VALUES (${studentId}, ${academyId}, 'PUSH_SHUTTLE_BOARD', 'SENT')
            `;
        } catch (logErr) {
            console.error('[Contact Log] Failed:', logErr);
            // Ignore log error as long as PUSH went through
        }

        return NextResponse.json({ 
            success: true, 
            message: '승차 알림이 발송되었습니다.',
            pushResult
        });
    } catch (error: any) {
        console.error('[Board-Notification-Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
