import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = params.id;
        const body = await request.json();
        const { name, parentPhone, passcode, memo, className } = body;

        console.log(`[PUT] Student ID: ${id}`, body);

        const { rows } = await sql`
      UPDATE students
      SET name = ${name}, parent_phone = ${parentPhone}, passcode = ${passcode}, memo = ${memo}, class_name = ${className || ''}
      WHERE id = ${id}
      RETURNING *;
    `;

        console.log(`[PUT] Updated Row:`, rows[0]);

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`[PUT] Error:`, error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        await sql`DELETE FROM students WHERE id = ${id}`;
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}
