import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, password } = body;

        // Clean phone number for comparison
        const cleanPhone = phone.replace(/[^0-9]/g, '');

        // Find student with matching phone and password using robust regex comparison
        const { rows } = await sql`
            SELECT id, name, parent_phone, academy_id 
            FROM students 
            WHERE REGEXP_REPLACE(parent_phone, '[^0-9]', '', 'g') = ${cleanPhone}
            AND parent_password = ${password}
            LIMIT 1;
        `;

        if (rows.length === 0) {
            return NextResponse.json({ error: '정보가 일치하지 않습니다.' }, { status: 401 });
        }

        const student = rows[0];

        // Create parent session
        await login({
            id: student.academy_id, // We use academy_id to know which academy context they belong to
            username: student.parent_phone,
            role: 'PARENT',
            student_id: student.id,
            student_name: student.name
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[ParentLogin] Error:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
