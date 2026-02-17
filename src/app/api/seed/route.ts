import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const client = await db.connect();

    // 0. Admins Table
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

    // Insert Initial Super Admin if not exists
    await client.sql`
      INSERT INTO admins (username, password, role, admin_name, status)
      VALUES ('admin95', '12345', 'SUPER', '슈퍼관리자', 'ACTIVE')
      ON CONFLICT (username) DO NOTHING;
    `;

    // 1. Students Table (Update with class_name and academy_id)
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

    // Migration: Add columns
    await client.sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES admins(id) ON DELETE CASCADE;`;
    await client.sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS class_name VARCHAR(100);`;

    // 2. Attendance Table
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

    // 3. Classes Table
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

    await client.sql`
      CREATE TABLE IF NOT EXISTS message_templates (
        id SERIAL PRIMARY KEY,
        academy_id UUID REFERENCES admins(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.sql`ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES admins(id) ON DELETE CASCADE;`;

    // 4. Tuition Records Table
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

    // 5. Update existing records to link to the super admin for initial testing (if needed)
    // But better to let them be null or assigned during first login.
    // Let's assign them to admin95 for now to avoid broken queries.
    const superAdminRes = await client.sql`SELECT id FROM admins WHERE username = 'admin95' LIMIT 1;`;
    const superAdminId = superAdminRes.rows[0].id;

    await client.sql`UPDATE students SET academy_id = ${superAdminId} WHERE academy_id IS NULL;`;
    await client.sql`UPDATE classes SET academy_id = ${superAdminId} WHERE academy_id IS NULL;`;
    await client.sql`UPDATE message_templates SET academy_id = ${superAdminId} WHERE academy_id IS NULL;`;

    // 3. Insert Dummy Data (Optional)
    const { searchParams } = new URL(request.url);
    if (searchParams.get('mode') === 'dummy') {
      const lastNames = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"];
      const firstNames = ["민수", "지원", "서연", "도윤", "하은", "준호", "지우", "예준", "서현", "민재", "수진", "현우", "지민", "가은"];
      const classes = ["월수금반", "화목토반", "초등A반", "중등B반"];

      for (let i = 0; i < 20; i++) {
        const name = lastNames[Math.floor(Math.random() * lastNames.length)] + firstNames[Math.floor(Math.random() * firstNames.length)];
        const parentPhone = `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;
        const passcode = Math.floor(Math.random() * 9000 + 1000).toString();
        const className = classes[Math.floor(Math.random() * classes.length)];

        await client.sql`
                INSERT INTO students (name, parent_phone, passcode, memo, class_name, academy_id)
                VALUES (${name}, ${parentPhone}, ${passcode}, '테스트 데이터', ${className}, ${superAdminId});
            `;
      }
      return NextResponse.json({ message: 'Database seeded with 20 dummy students linked to super admin' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Database schema updated successfully with admins table' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
