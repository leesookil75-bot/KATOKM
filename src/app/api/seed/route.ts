import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = await db.connect();

    // 1. Students Table (Update with class_name)
    await client.sql`
      CREATE TABLE IF NOT EXISTS students (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        parent_phone VARCHAR(50) NOT NULL,
        passcode VARCHAR(10),
        memo TEXT,
        class_name VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Add column if it doesn't exist (for migration)
    await client.sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS class_name VARCHAR(100);`;

    // 2. Attendance Table
    await client.sql`
      CREATE TABLE IF NOT EXISTS attendance (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, date)
      );
    `;

    return NextResponse.json({ message: 'Database seeded successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
