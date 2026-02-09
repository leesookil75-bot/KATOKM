import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { passcode } = await request.json();
        const client = await db.connect();

        // 1. Find Student by Passcode
        const { rows } = await client.sql`
      SELECT * FROM students WHERE passcode = ${passcode} LIMIT 1;
    `;

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        const student = rows[0];
        const today = new Date().toISOString().split('T')[0];

        // 2. Mark Attendance (Upsert: If exists, do nothing or update?)
        // Requirement says: "Automatically marked as 'O' (Present)"
        const status = '출석';

        await client.sql`
      INSERT INTO attendance (student_id, date, status)
      VALUES (${student.id}, ${today}, ${status})
      ON CONFLICT (student_id, date) 
      DO UPDATE SET status = ${status}, created_at = CURRENT_TIMESTAMP;
    `;

        // 3. Mock SMS Sending (Log to console/server)
        console.log(`[SMS-MOCK] Sending to ${student.parent_phone}: ${student.name} 학생이 등원하였습니다.`);

        return NextResponse.json({
            success: true,
            student: { name: student.name, parentPhone: student.parent_phone }
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}
