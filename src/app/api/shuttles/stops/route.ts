import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const routeId = searchParams.get('routeId');

        if (!routeId) {
            return NextResponse.json({ error: 'Missing routeId' }, { status: 400 });
        }

        const client = await db.connect();
        
        const { rows } = await client.sql`
            SELECT id, stop_name, lat, lng, arrival_time, order_index
            FROM shuttle_stops
            WHERE route_id = ${routeId}
            ORDER BY order_index ASC
        `;

        return NextResponse.json({ stops: rows });
    } catch (error: any) {
        console.error('[Stops-Get-Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
