import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const routeId = searchParams.get('routeId');

        if (!routeId) {
            return NextResponse.json({ error: 'Missing routeId' }, { status: 400 });
        }
        
        const { rows } = await sql`
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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { route_id, stop_name, arrival_time } = body;

        if (!route_id || !stop_name || !arrival_time) {
            return NextResponse.json({ error: '필수 입력값이 누락되었습니다.' }, { status: 400 });
        }

        // Get max order_index for this route
        const { rows: maxRows } = await sql`
            SELECT COALESCE(MAX(order_index), -1) as "maxIndex"
            FROM shuttle_stops 
            WHERE route_id = ${route_id}
        `;
        const nextIndex = parseInt(maxRows[0].maxIndex) + 1;

        // Note: Future feature will allow dragging pins on map to set lat/lng
        // Currently setting defaults matching Seoul center
        const lat = 37.566826;
        const lng = 126.9786567;

        const { rows } = await sql`
            INSERT INTO shuttle_stops (route_id, stop_name, arrival_time, lat, lng, order_index)
            VALUES (${route_id}, ${stop_name}, ${arrival_time}, ${lat}, ${lng}, ${nextIndex})
            RETURNING *
        `;

        return NextResponse.json({ success: true, stop: rows[0] });
    } catch (error: any) {
        console.error('[Stops-Post-Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
