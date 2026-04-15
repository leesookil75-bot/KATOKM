import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS shuttle_stops (
                id SERIAL PRIMARY KEY,
                route_id INTEGER NOT NULL REFERENCES shuttle_routes(id) ON DELETE CASCADE,
                stop_name VARCHAR(100) NOT NULL,
                lat DOUBLE PRECISION DEFAULT 37.566826,
                lng DOUBLE PRECISION DEFAULT 126.9786567,
                arrival_time VARCHAR(10) NOT NULL,
                order_index INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        await sql`CREATE INDEX IF NOT EXISTS idx_shuttle_stops_route ON shuttle_stops(route_id);`;

        return NextResponse.json({ success: true, message: 'Shuttle stops table created mapping coordinates' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
