import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const academyId = session.user.id;
        const studentId = params.id;

        // Fetch student to get parent phone
        const { rows: studentRows } = await sql`SELECT parent_phone FROM students WHERE id = ${studentId} AND academy_id = ${academyId}`;

        if (studentRows.length === 0) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        const parentPhone = studentRows[0].parent_phone;
        const initialPassword = parentPhone.replace(/[^0-9]/g, '').slice(-4);

        await sql`
            UPDATE students 
            SET parent_password = ${initialPassword} 
            WHERE id = ${studentId} AND academy_id = ${academyId}
        `;

        return NextResponse.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('[ResetPassword] Error:', error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
