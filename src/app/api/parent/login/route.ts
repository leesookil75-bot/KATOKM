import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { getAdminAuth } from '@/lib/firebase/adminApp';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Use ID Token from Firebase Phone Auth
        const { idToken } = body;

        if (!idToken) {
            return NextResponse.json({ error: '인증 토큰이 없습니다.' }, { status: 400 });
        }

        // Verify Firebase ID Token
        const adminAuth = getAdminAuth();
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const phoneNumber = decodedToken.phone_number;

        if (!phoneNumber) {
            return NextResponse.json({ error: '전화번호 인증 정보가 없습니다.' }, { status: 400 });
        }

        // Clean phone number for DB comparison
        // Firebase returns E.164 e.g., +821012345678 -> 01012345678
        let cleanPhone = phoneNumber;
        if (cleanPhone.startsWith('+82')) {
            cleanPhone = '0' + cleanPhone.substring(3);
        } else if (cleanPhone.startsWith('+')) {
            cleanPhone = cleanPhone.substring(1);
        }
        
        // Remove strictly any remaining non-numeric
        cleanPhone = cleanPhone.replace(/[^0-9]/g, '');

        // Find student and academy name using ONLY the verified phone number (password no longer needed)
        const { rows } = await sql`
            SELECT s.id, s.name, s.parent_phone, s.academy_id, a.academy_name
            FROM students s
            JOIN admins a ON s.academy_id = a.id
            WHERE REGEXP_REPLACE(s.parent_phone, '[^0-9]', '', 'g') = ${cleanPhone}
            LIMIT 1;
        `;

        if (rows.length === 0) {
            return NextResponse.json({ error: '시스템에 등록된 학부모 번호가 아닙니다. 학원에 문의해주세요.' }, { status: 401 });
        }

        const student = rows[0];

        // Create parent session via our standard jose JWT
        await login({
            id: student.academy_id,
            username: student.parent_phone,
            role: 'PARENT',
            student_id: student.id,
            student_name: student.name,
            academy_name: student.academy_name
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[ParentLogin] Error:', error);
        
        if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: '인증이 만료되었습니다. 다시 시도해주세요.' }, { status: 401 });
        }
        
        // **Return exact error string to UI to debug what's wrong**
        return NextResponse.json({ error: '서버에러: ' + (error.message || error.toString()) }, { status: 500 });
    }
}
