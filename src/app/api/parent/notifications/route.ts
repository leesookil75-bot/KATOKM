import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.user.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const studentId = session.user.student_id;

        const { rows } = await sql`
            SELECT id, title, body, created_at
            FROM notifications
            WHERE student_id = ${studentId}
            ORDER BY created_at DESC
            LIMIT 10
        `;

        return NextResponse.json(rows);
    } catch (error) {
        console.error('[Parent-Notifications-API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
