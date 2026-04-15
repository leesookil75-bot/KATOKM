import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const academyId = session.user.id;
        const body = await request.json();
        const { studentId, contactType, actionStatus } = body;

        if (!studentId || !contactType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify student belongs to this academy
        const { rows: studentCheck } = await sql`
            SELECT id FROM students WHERE id = ${studentId} AND academy_id = ${academyId}
        `;
        
        if (studentCheck.length === 0) {
            return NextResponse.json({ error: '접근 권한이 없는 학생입니다.' }, { status: 403 });
        }

        const { rows } = await sql`
            INSERT INTO contact_logs (student_id, academy_id, contact_type, action_status)
            VALUES (${studentId}, ${academyId}, ${contactType}, ${actionStatus || 'SENT'})
            RETURNING *;
        `;

        return NextResponse.json({ success: true, log: rows[0] });
    } catch (error: any) {
        console.error('[Contact Log POST] Error:', error);
        return NextResponse.json({ error: error.message || '로그 저장에 실패했습니다.' }, { status: 500 });
    }
}
