import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS shuttle_passengers (
                stop_id INTEGER NOT NULL REFERENCES shuttle_stops(id) ON DELETE CASCADE,
                student_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (stop_id, student_id)
            );
        `;

        return NextResponse.json({ success: true, message: 'Shuttle passengers mapping table created' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
