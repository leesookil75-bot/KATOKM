import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session || session.user.role === 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const studentId = params.id;
        const reasonsJson = JSON.stringify(['✅ 원장님 케어 완료 (모니터링 중)']);

        // 수동으로 케어가 완료되었으므로, 위험도를 강제로 가장 안전한 상태(Green)로 떨어뜨립니다.
        // 다음 크론잡이 실행될 때 원인이 미해결 상태라면 다시 올라갈 수 있습니다.
        await sql`
            UPDATE students 
            SET risk_score = 0, 
                risk_level = 'Green', 
                risk_reasons = ${reasonsJson},
                risk_updated_at = CURRENT_TIMESTAMP
            WHERE id = ${studentId} AND academy_id = ${session.user.id}
        `;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Risk Resolve POST] Error:', error);
        return NextResponse.json({ error: '상태 변경에 실패했습니다.' }, { status: 500 });
    }
}
