import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Add risk columns if they don't exist
        await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS risk_score INT DEFAULT 0;`;
        await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20) DEFAULT 'Green';`;
        await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS risk_reasons TEXT DEFAULT '[]';`;
        await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS risk_updated_at TIMESTAMP WITH TIME ZONE;`;
        
        // Add index on risk_level for faster filtering
        await sql`CREATE INDEX IF NOT EXISTS idx_students_risk_level ON students(risk_level);`;

        return NextResponse.json({ success: true, message: 'Risk columns added to students table' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
