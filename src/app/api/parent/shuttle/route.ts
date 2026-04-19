import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const studentId = session.user.student_id;
        if (!studentId) return NextResponse.json({ error: 'Student ID not found' }, { status: 400 });

        // Find the stop assigned to this student
        // Using SAFE query with precise string matching on json array
        const { rows } = await sql`
            SELECT 
                s.id as stop_id, s.stop_name, s.arrival_time, s.lat as stop_lat, s.lng as stop_lng,
                r.id as route_id, r.route_name, r.driver_phone, r.current_lat, r.current_lng, r.is_driving, r.last_location_time
            FROM shuttle_stops s
            JOIN shuttle_passengers sp ON s.id = sp.stop_id
            JOIN shuttle_routes r ON s.route_id = r.id
            WHERE sp.student_id = ${studentId}
            LIMIT 1;
        `;

        if (rows.length === 0) {
            return NextResponse.json({ assigned: false });
        }

        return NextResponse.json({
            assigned: true,
            info: rows[0]
        });
    } catch (error: any) {
        console.error('[Parent Shuttle Get Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
