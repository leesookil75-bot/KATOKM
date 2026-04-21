import { db } from '@vercel/postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const client = await db.connect();
  try {
    const { rows: students } = await client.sql`SELECT id, name FROM students LIMIT 3`;
    if (students.length === 0) {
      console.log('No students found');
      return;
    }
    
    if (students[0]) {
      await client.sql`UPDATE students SET risk_score = 85, risk_level = 'Red', risk_reasons = '["최근 3회 연속 결석", "수강료 미납"]' WHERE id = ${students[0].id}`;
      console.log('Set RED:', students[0].name);
    }
    
    if (students[1]) {
      await client.sql`UPDATE students SET risk_score = 45, risk_level = 'Yellow', risk_reasons = '["최근 2회 연속 결석"]' WHERE id = ${students[1].id}`;
      console.log('Set YELLOW:', students[1].name);
    }
    
    if (students[2]) {
      await client.sql`UPDATE students SET risk_score = 35, risk_level = 'Yellow', risk_reasons = '["이번 달 회비 미납 (납부일 경과)"]' WHERE id = ${students[2].id}`;
      console.log('Set YELLOW:', students[2].name);
    }
    
  } catch(e) {
    console.error(e);
  } finally {
    client.release();
  }
}
run();
