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
                INSERT INTO students (name, parent_phone, passcode, memo, class_name)
                VALUES (${name}, ${parentPhone}, ${passcode}, '테스트 데이터', ${className});
            `;
      }
      return NextResponse.json({ message: 'Database seeded with 20 dummy students' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Database schema updated successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
