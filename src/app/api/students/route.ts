import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const academyId = session.user.id;
        const { rows } = await sql`SELECT * FROM students WHERE academy_id = ${academyId} ORDER BY class_name ASC, name ASC`;

        const students = rows.map(row => ({
            id: row.id,
            name: row.name,
            parentPhone: row.parent_phone,
            passcode: row.passcode,
            memo: row.memo,
            className: row.class_name,
            tuition_due_day: row.tuition_due_day
        }));
        return NextResponse.json(students);
    } catch (error: any) {
        console.error('[Students GET] Error:', error);
        return NextResponse.json({ error: error.message || '목록을 불러오는데 실패했습니다.' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const academyId = session.user.id;
        const body = await request.json();
        const { name, parentPhone, passcode, memo, className, tuition_due_day } = body;

        // Initial password is last 4 digits of phone
        const initialPassword = parentPhone.replace(/[^0-9]/g, '').slice(-4);

        const { rows } = await sql`
      INSERT INTO students (name, parent_phone, passcode, memo, class_name, academy_id, tuition_due_day, parent_password)
      VALUES (${name}, ${parentPhone}, ${passcode}, ${memo}, ${className || ''}, ${academyId}, ${tuition_due_day || null}, ${initialPassword})
      RETURNING *;
    `;

        return NextResponse.json(rows[0]);
    } catch (error: any) {
        console.error('[Students POST] Error:', error);
        return NextResponse.json({ error: error.message || '저장 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
