import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const academyId = session.user.id;
        const { rows } = await sql`SELECT * FROM classes WHERE academy_id = ${academyId} ORDER BY name ASC;`;
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
        const { name } = await request.json();

        // Check if exists for this academy
        const { rows: existing } = await sql`SELECT * FROM classes WHERE name = ${name} AND academy_id = ${academyId}`;
        if (existing.length > 0) {
            return NextResponse.json({ error: 'Class already exists' }, { status: 409 });
        }

        const { rows } = await sql`
      INSERT INTO classes (name, academy_id) VALUES (${name}, ${academyId}) RETURNING *;
    `;
        return NextResponse.json(rows[0]);
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}
