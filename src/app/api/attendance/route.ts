import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const session = await getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const academyId = session.user.id;

    try {
        if (date) {
            // Daily Attendance for this academy
            const { rows } = await sql`
        SELECT a.student_id, a.status, a.memo, s.class_name
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE a.date = ${date}::date AND s.academy_id = ${academyId}
      `;
            return NextResponse.json(rows);
        }

        // Default: Return attendance for ALL students of this academy
        const { rows } = await sql`
            SELECT a.student_id, a.date, a.status, a.memo
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE s.academy_id = ${academyId}
        `;
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const academyId = session.user.id;
        const body = await request.json();
        const { studentId, date, status, memo } = body;

        // Verify student belongs to this academy
        const { rows: studentCheck } = await sql`SELECT id FROM students WHERE id = ${studentId} AND academy_id = ${academyId}`;
        if (studentCheck.length === 0) {
            return NextResponse.json({ error: '접근 권한이 없는 학생입니다.' }, { status: 403 });
        }

        await sql`
      INSERT INTO attendance (student_id, date, status, memo)
      VALUES (${studentId}, ${date}, ${status}, ${memo || ''})
      ON CONFLICT (student_id, date) 
      DO UPDATE SET status = ${status}, memo = ${memo || ''}, created_at = CURRENT_TIMESTAMP;
    `;
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}
