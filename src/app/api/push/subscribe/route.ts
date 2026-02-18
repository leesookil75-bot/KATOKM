import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.user.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const studentId = session.user.student_id;
        const { subscription } = await request.json();

        if (!subscription) {
            return NextResponse.json({ error: 'Subscription missing' }, { status: 400 });
        }

        // Save subscription
        await sql`
            INSERT INTO push_subscriptions (student_id, subscription)
            VALUES (${studentId}, ${JSON.stringify(subscription)})
            ON CONFLICT (student_id, subscription) DO NOTHING;
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Push-Subscribe] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
