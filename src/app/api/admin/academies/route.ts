import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.user.role !== 'SUPER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { rows } = await sql`
            SELECT id, username, academy_name, admin_name, phone, address, status, created_at 
            FROM admins 
            WHERE role = 'ACADEMY'
            ORDER BY created_at DESC
        `;

        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch academies' }, { status: 500 });
    }
}
