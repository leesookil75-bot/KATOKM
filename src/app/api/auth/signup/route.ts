import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/adminApp';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            academyName,
            adminName,
            idToken,
            address,
            username,
            password
        } = body;

        if (!idToken) {
            return NextResponse.json({ error: '휴대폰 본인인증이 완료되지 않았습니다.' }, { status: 400 });
        }

        // Verify the Firebase idToken
        const adminAuth = getAdminAuth();
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const verifiedPhone = decodedToken.phone_number;

        if (!verifiedPhone) {
            return NextResponse.json({ error: '유효한 전화번호 정보가 없습니다.' }, { status: 400 });
        }

        // Check if username exists
        const { rows: existingUser } = await sql`
            SELECT id FROM admins WHERE username = ${username}
        `;

        if (existingUser.length > 0) {
            return NextResponse.json({ error: '이미 존재하는 아이디입니다.' }, { status: 400 });
        }

        await sql`
            INSERT INTO admins (
                username, 
                password, 
                role, 
                academy_name, 
                admin_name, 
                phone, 
                address, 
                status
            )
            VALUES (
                ${username}, 
                ${password}, 
                'ACADEMY', 
                ${academyName}, 
                ${adminName}, 
                ${verifiedPhone}, 
                ${address}, 
                'PENDING'
            )
        `;

        return NextResponse.json({ success: true, message: '회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.' });
    } catch (error: any) {
        console.error('Signup error:', error);
        return NextResponse.json({
            error: '회원가입 중 오류가 발생했습니다.',
            details: error.message || String(error)
        }, { status: 500 });
    }
}
