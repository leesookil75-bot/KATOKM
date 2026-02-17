import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        const { rows } = await sql`
            SELECT id, username, password, role, academy_name, status 
            FROM admins 
            WHERE username = ${username}
        `;

        if (rows.length === 0) {
            return NextResponse.json({ error: '존재하지 않는 사용자입니다.' }, { status: 401 });
        }

        const user = rows[0];

        // Simplified password check for v2.0 prototype (in production use bcrypt)
        if (user.password !== password) {
            return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
        }

        if (user.status === 'PENDING') {
            return NextResponse.json({ error: '관리자 승인 대기 중입니다.' }, { status: 403 });
        }

        await login({
            id: user.id,
            username: user.username,
            role: user.role,
            academy_name: user.academy_name
        });

        return NextResponse.json({ success: true, role: user.role });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: '로그인 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
