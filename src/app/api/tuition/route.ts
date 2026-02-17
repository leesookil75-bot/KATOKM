import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const academyId = session.user.id;

        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year') || new Date().getFullYear().toString();

        // Fetch all tuition records for students of this academy in the given year
        const result = await sql`
      SELECT tr.* 
      FROM tuition_records tr
      JOIN students s ON tr.student_id = s.id
      WHERE s.academy_id = ${academyId} AND tr.year = ${year}
    `;

        return NextResponse.json({ records: result.rows });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to fetch tuition records' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const academyId = session.user.id;

        const { student_id, year, month, status, payment_date } = await request.json();

        if (!student_id || !year || !month || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify student belongs to this academy
        const { rows: studentCheck } = await sql`SELECT id FROM students WHERE id = ${student_id} AND academy_id = ${academyId}`;
        if (studentCheck.length === 0) {
            return NextResponse.json({ error: '접근 권한이 없는 학생입니다.' }, { status: 403 });
        }

        // Upsert logic
        const result = await sql`
      INSERT INTO tuition_records (student_id, year, month, status, payment_date)
      VALUES (${student_id}, ${year}, ${month}, ${status}, ${payment_date})
      ON CONFLICT (student_id, year, month)
      DO UPDATE SET status = ${status}, payment_date = ${payment_date}, created_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

        return NextResponse.json({ record: result.rows[0] });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to update tuition record' }, { status: 500 });
    }
}
