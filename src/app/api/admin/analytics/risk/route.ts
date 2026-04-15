import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const academyId = session.user.id;
        
        // Fetch pre-calculated risk students
        const { rows: riskList } = await sql`
            SELECT id, name, class_name, risk_score as score, risk_level as "riskLevel", risk_reasons as reasons
            FROM students
            WHERE academy_id = ${academyId} 
              AND risk_level IN ('Red', 'Yellow')
            ORDER BY risk_score DESC
        `;

        // Note: reasons string/array might be a JSON string from DB.
        // If it's a JSON string, we should parse it for the frontend
        const parsedList = riskList.map(item => {
            let parsedReasons = [];
            try {
                if (typeof item.reasons === 'string') {
                    parsedReasons = JSON.parse(item.reasons);
                } else if (Array.isArray(item.reasons)) {
                    parsedReasons = item.reasons;
                }
            } catch (e) {
                // fallback
            }
            return {
                ...item,
                reasons: parsedReasons
            };
        });

        return NextResponse.json(parsedList);
    } catch (error: any) {
        console.error('[Analytics Risk GET] Error:', error);
        return NextResponse.json({ error: '데이터를 불러오는데 실패했습니다.' }, { status: 500 });
    }
}
