import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { routeId, lat, lng } = await request.json();

        if (!routeId || !lat || !lng) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const client = await db.connect();
        
        await client.sql`
            UPDATE shuttle_routes 
            SET current_lat = ${lat}, current_lng = ${lng}, last_location_time = CURRENT_TIMESTAMP
            WHERE id = ${routeId}
        `;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Location-Update-Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const academyId = searchParams.get('academyId');

        let result;
        const client = await db.connect();

        if (academyId) {
            // Fetch routes assigned to this academy
            result = await client.sql`
                SELECT id, route_name, driver_name, driver_phone, current_lat, current_lng, last_location_time
                FROM shuttle_routes
                WHERE academy_id = ${academyId}
            `;
        } else {
            // Fetch all (super admin or for broader scopes)
            result = await client.sql`
                SELECT id, academy_id, route_name, driver_name, driver_phone, current_lat, current_lng, last_location_time
                FROM shuttle_routes
            `;
        }

        return NextResponse.json({ routes: result.rows });
    } catch (error: any) {
        console.error('[Location-Get-Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
