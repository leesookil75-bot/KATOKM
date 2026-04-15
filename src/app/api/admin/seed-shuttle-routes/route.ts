import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS shuttle_routes (
                id SERIAL PRIMARY KEY,
                academy_id VARCHAR(255) NOT NULL,
                route_name VARCHAR(100) NOT NULL,
                driver_name VARCHAR(50),
                driver_phone VARCHAR(50),
                vehicle_number VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        await sql`CREATE INDEX IF NOT EXISTS idx_shuttle_routes_academy ON shuttle_routes(academy_id);`;

        return NextResponse.json({ success: true, message: 'Shuttle routes table created' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
