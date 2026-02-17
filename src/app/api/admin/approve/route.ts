import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.user.role !== 'SUPER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, status } = body; // status can be 'APPROVED' or 'REJECTED' (deleted)

        if (status === 'APPROVED') {
            await sql`
                UPDATE admins 
                SET status = 'APPROVED' 
                WHERE id = ${id}
            `;
        } else if (status === 'REJECTED') {
            await sql`
                DELETE FROM admins 
                WHERE id = ${id}
            `;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}
