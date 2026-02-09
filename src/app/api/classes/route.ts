import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const client = await db.connect();
        const { rows } = await client.sql`SELECT * FROM classes ORDER BY name ASC;`;
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        const client = await db.connect();

        // Check if exists
        const { rows: existing } = await client.sql`SELECT * FROM classes WHERE name = ${name}`;
        if (existing.length > 0) {
            return NextResponse.json({ error: 'Class already exists' }, { status: 409 });
        }

        const { rows } = await client.sql`
      INSERT INTO classes (name) VALUES (${name}) RETURNING *;
    `;
        return NextResponse.json(rows[0]);
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}
