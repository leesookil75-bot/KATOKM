import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const academyId = session.user.id;
        
        const { rows } = await sql`
            SELECT * FROM shuttle_routes 
            WHERE academy_id = ${academyId} 
            ORDER BY created_at ASC
        `;
        
        return NextResponse.json(rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const academyId = session.user.id;
        const body = await request.json();
        const { route_name, driver_name, driver_phone, vehicle_number } = body;

        if (!route_name) {
            return NextResponse.json({ error: '노선 이름은 필수입니다.' }, { status: 400 });
        }

        const { rows } = await sql`
            INSERT INTO shuttle_routes (academy_id, route_name, driver_name, driver_phone, vehicle_number)
            VALUES (${academyId}, ${route_name}, ${driver_name || ''}, ${driver_phone || ''}, ${vehicle_number || ''})
            RETURNING *
        `;

        return NextResponse.json({ success: true, route: rows[0] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
