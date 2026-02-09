import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month'); // YYYY-MM
    const className = searchParams.get('class');

    try {
        if (date) {
            // Daily Attendance
            const { rows } = await sql`
        SELECT a.student_id, a.status, a.memo, s.class_name
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE a.date = ${date}::date
      `;
            return NextResponse.json(rows);
        }

        // Default: Return ALL attendance logic (for Month/Week views)
        // In a real app, strict date range filtering is better.
        const { rows } = await sql`
            SELECT student_id, date, status, memo
            FROM attendance
        `;
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { studentId, date, status, memo } = body;

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
