import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.user.role === 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const academyId = session.user.id;

        // 원장님의 태권도장에 등록된 학생 3명을 가져옵니다.
        const { rows: students } = await sql`
            SELECT id, name FROM students WHERE academy_id = ${academyId} LIMIT 3
        `;

        if (students.length === 0) {
            return NextResponse.json({ message: '아직 등록된 학생이 없습니다. 학생 관리 메뉴에서 먼저 학생을 3명 이상 등록해주세요.' });
        }

        // 테스트 데이터 주입
        if (students[0]) {
            await sql`UPDATE students SET risk_score = 85, risk_level = 'Red', risk_reasons = '["최근 3회 연속 결석", "지난달 회비 미납"]' WHERE id = ${students[0].id}`;
        }
        if (students[1]) {
            await sql`UPDATE students SET risk_score = 45, risk_level = 'Yellow', risk_reasons = '["최근 2회 연속 결석"]' WHERE id = ${students[1].id}`;
        }
        if (students[2]) {
            await sql`UPDATE students SET risk_score = 35, risk_level = 'Yellow', risk_reasons = '["이번 달 회비 미납 (납부일 경과)"]' WHERE id = ${students[2].id}`;
        }

        const names = students.map(s => s.name).join(', ');
        return NextResponse.json({ 
            message: `성공! 다음 3명의 학생에게 임의의 위험도 데이터가 주입되었습니다: ${names}. 홈 화면의 스마트 케어 리포트를 확인해주세요.` 
        });

    } catch (error: any) {
        console.error('[Test Risk GET] Error:', error);
        return NextResponse.json({ error: '실패했습니다.' }, { status: 500 });
    }
}
