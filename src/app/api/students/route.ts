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
            className: row.class_name
        }));
        return NextResponse.json(students);
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
        const { name, parentPhone, passcode, memo, className } = body;

        const { rows } = await sql`
      INSERT INTO students (name, parent_phone, passcode, memo, class_name, academy_id)
      VALUES (${name}, ${parentPhone}, ${passcode}, ${memo}, ${className || ''}, ${academyId})
      RETURNING *;
    `;

        return NextResponse.json(rows[0]);
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}
