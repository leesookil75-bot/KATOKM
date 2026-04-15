import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS contact_logs (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR(255) NOT NULL,
                academy_id VARCHAR(255) NOT NULL,
                contact_type VARCHAR(50) NOT NULL, -- PUSH, CALL, SMS
                action_status VARCHAR(50) NOT NULL DEFAULT 'SENT', -- SENT, FAILED, ANSWERED
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        // Add index for fast querying by student
        await sql`CREATE INDEX IF NOT EXISTS idx_contact_logs_student ON contact_logs(student_id);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_contact_logs_academy_date ON contact_logs(academy_id, created_at);`;

        return NextResponse.json({ success: true, message: 'contact_logs table created successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
