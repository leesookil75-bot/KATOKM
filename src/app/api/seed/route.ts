import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const results: any = {};

  try {
    const client = await db.connect();

    // 1. Extensions
    try {
      await client.sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;
      results.extensions = "pgcrypto ensured";
    } catch (e: any) {
      results.extensions = "Extension already exists or permission denied: " + e.message;
    }

    // 2. Admins Table
    await client.sql`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'ACADEMY',
        academy_name VARCHAR(255),
        admin_name VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    results.adminsTable = "OK";

    // 3. Super Admin
    await client.sql`
      INSERT INTO admins (username, password, role, admin_name, status)
      VALUES ('admin95', '12345', 'SUPER', '슈퍼관리자', 'APPROVED')
      ON CONFLICT (username) DO NOTHING;
    `;
    results.superAdmin = "OK";

    // 4. Classes Table
    await client.sql`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        academy_id UUID REFERENCES admins(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(academy_id, name)
      );
    `;
    await client.sql`ALTER TABLE classes ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES admins(id) ON DELETE CASCADE;`;
    results.classesTable = "OK";

    // 5. Students Table
    await client.sql`
      CREATE TABLE IF NOT EXISTS students (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        academy_id UUID REFERENCES admins(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        parent_phone VARCHAR(50) NOT NULL,
        passcode VARCHAR(10),
        memo TEXT,
        class_name VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES admins(id) ON DELETE CASCADE;`;
    await client.sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS class_name VARCHAR(100);`;
    await client.sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS tuition_due_day INTEGER;`;
    await client.sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_password VARCHAR(255);`;
    results.studentsTable = "OK";

    // 6. Attendance Table
    await client.sql`
      CREATE TABLE IF NOT EXISTS attendance (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL,
        memo TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, date)
      );
    `;
    await client.sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS memo TEXT;`;
    results.attendanceTable = "OK";

    // 7. Message Templates
    await client.sql`
      CREATE TABLE IF NOT EXISTS message_templates (
        id SERIAL PRIMARY KEY,
        academy_id UUID REFERENCES admins(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.sql`ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES admins(id) ON DELETE CASCADE;`;
    results.messageTemplatesTable = "OK";

    // 8. Tuition Table
    await client.sql`
      CREATE TABLE IF NOT EXISTS tuition_records (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('paid', 'unpaid')),
        payment_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, year, month)
      );
    `;
    results.tuitionTable = "OK";

    // 9. Push Subscriptions Table
    await client.sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        student_id TEXT NOT NULL,
        subscription JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, subscription)
      );
    `;
    results.pushSubscriptionsTable = "OK";

    // 10. Notifications History Table
    await client.sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        student_id TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    results.notificationsTable = "OK";

    // 11. Initial Link
    const superAdminRes = await client.sql`SELECT id FROM admins WHERE username = 'admin95' LIMIT 1;`;
    if (superAdminRes.rows.length > 0) {
      const superAdminId = superAdminRes.rows[0].id;
      await client.sql`UPDATE students SET academy_id = ${superAdminId} WHERE academy_id IS NULL;`;
      await client.sql`UPDATE classes SET academy_id = ${superAdminId} WHERE academy_id IS NULL;`;
      await client.sql`UPDATE message_templates SET academy_id = ${superAdminId} WHERE academy_id IS NULL;`;
      results.links = "Updated missing links to SuperAdmin";
    }

    return NextResponse.json({
      message: 'Database schema setup completed',
      details: results
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Database initialization failed',
      details: error.message,
      results: results
    }, { status: 500 });
  }
}
