import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { rows } = await sql`SELECT * FROM students ORDER BY class_name ASC, name ASC`;
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, parentPhone, passcode, memo, className } = body;

        const { rows } = await sql`
      INSERT INTO students (name, parent_phone, passcode, memo, class_name)
      VALUES (${name}, ${parentPhone}, ${passcode}, ${memo}, ${className || ''})
      RETURNING *;
    `;

        return NextResponse.json(rows[0]);
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}
