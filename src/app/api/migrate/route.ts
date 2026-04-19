import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await sql`ALTER TABLE shuttle_routes ADD COLUMN IF NOT EXISTS is_driving BOOLEAN DEFAULT FALSE`;
        await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS dream_energy NUMERIC(5, 1) DEFAULT 36.5`;
        await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS dream_tier INTEGER DEFAULT 0`;
        return NextResponse.json({ success: true, message: 'Migrations complete' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
