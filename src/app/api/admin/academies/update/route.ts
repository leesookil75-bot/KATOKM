import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.user.role !== 'SUPER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, academy_name, admin_name, phone, address, username, password } = body;

        await sql`
            UPDATE admins 
            SET 
                academy_name = ${academy_name}, 
                admin_name = ${admin_name}, 
                phone = ${phone}, 
                address = ${address}, 
                username = ${username}, 
                password = ${password}
            WHERE id = ${id}
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update academy' }, { status: 500 });
    }
}
