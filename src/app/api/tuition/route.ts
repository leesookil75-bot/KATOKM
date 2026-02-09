import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year') || new Date().getFullYear().toString();

        // Fetch all tuition records for the given year
        const result = await sql`
      SELECT * FROM tuition_records
      WHERE year = ${year}
    `;

        // Process result to be easily consumable by frontend (e.g., map by student_id)
        // Actually, returning list is fine, frontend can map it.
        return NextResponse.json({ records: result.rows });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to fetch tuition records' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { student_id, year, month, status, payment_date } = await request.json();

        if (!student_id || !year || !month || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Upsert logic: If record exists for student+year+month, update it. Else insert.
        // payment_date can be null if status is 'unpaid'
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
