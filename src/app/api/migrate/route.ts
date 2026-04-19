import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await sql`ALTER TABLE shuttle_routes ADD COLUMN IF NOT EXISTS is_driving BOOLEAN DEFAULT FALSE`;
        return NextResponse.json({ success: true, message: 'is_driving column added' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
