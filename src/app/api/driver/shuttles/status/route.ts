import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { routeId, isDriving } = body;

        if (!routeId) {
            return NextResponse.json({ error: 'Missing routeId' }, { status: 400 });
        }

        const academyId = session.user.id;

        const { rows } = await sql`
            UPDATE shuttle_routes 
            SET is_driving = ${isDriving}
            WHERE id = ${routeId} AND academy_id = ${academyId}
            RETURNING *;
        `;
        
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Route not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true, isDriving });
    } catch (error: any) {
        console.error('[Driver Shuttle Status Update Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
