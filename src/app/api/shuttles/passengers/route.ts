import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const stopId = searchParams.get('stopId');

        if (!stopId) {
            return NextResponse.json({ error: 'Missing stopId' }, { status: 400 });
        }
        
        const { rows } = await sql`
            SELECT student_id
            FROM shuttle_passengers
            WHERE stop_id = ${stopId}
        `;

        return NextResponse.json({ studentIds: rows.map(r => r.student_id) });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { stop_id, student_ids } = body;

        if (!stop_id || !Array.isArray(student_ids)) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // 1. Delete existing passengers for this stop
        await sql`DELETE FROM shuttle_passengers WHERE stop_id = ${stop_id}`;

        // 2. Insert new passengers if any
        if (student_ids.length > 0) {
            // Using a simple loop as the array is small. In production, use pg-format or multi-row insert.
            for (const sId of student_ids) {
                await sql`INSERT INTO shuttle_passengers (stop_id, student_id) VALUES (${stop_id}, ${sId})`;
            }
        }

        return NextResponse.json({ success: true, message: '탑승자 명단이 업데이트 되었습니다.' });
    } catch (error: any) {
        console.error('[Passengers-Post-Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
