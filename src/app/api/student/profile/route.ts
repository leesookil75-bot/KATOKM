import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const studentId = session.user.student_id;
        if (!studentId) return NextResponse.json({ error: 'Student ID missing' }, { status: 400 });

        const { rows } = await sql`
            SELECT id, name, dream_energy, class_name
            FROM students
            WHERE id = ${studentId}
            LIMIT 1;
        `;

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            student: rows[0]
        });
    } catch (error: any) {
        console.error('[Student Profile Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
