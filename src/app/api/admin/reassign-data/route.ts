import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const targetUsername = searchParams.get('username');

    if (!targetUsername) {
        return NextResponse.json({ error: '사용자 아이디(username)를 입력해주세요. 예: ?username=admin1' }, { status: 400 });
    }

    try {
        // 1. Get Target Academy ID
        const { rows: targetAcademy } = await sql`
            SELECT id, academy_name FROM admins WHERE username = ${targetUsername}
        `;

        if (targetAcademy.length === 0) {
            return NextResponse.json({ error: `아이디가 '${targetUsername}'인 학원을 찾을 수 없습니다.` }, { status: 404 });
        }

        const targetId = targetAcademy[0].id;

        // 2. Get Super Admin ID (The source of test data)
        const { rows: superAdmin } = await sql`
            SELECT id FROM admins WHERE role = 'SUPER' AND username = 'admin95'
        `;

        if (superAdmin.length === 0) {
            return NextResponse.json({ error: '슈퍼관리자 계정을 찾을 수 없습니다.' }, { status: 500 });
        }

        const sourceId = superAdmin[0].id;

        // 3. Reassign Data
        const updates: any = {};

        const resStudents = await sql`
            UPDATE students SET academy_id = ${targetId} WHERE academy_id = ${sourceId}
        `;
        updates.students = `${resStudents.rowCount}명의 학생이 이전되었습니다.`;

        const resClasses = await sql`
            UPDATE classes SET academy_id = ${targetId} WHERE academy_id = ${sourceId}
        `;
        updates.classes = `${resClasses.rowCount}개의 수업이 이전되었습니다.`;

        const resTemplates = await sql`
            UPDATE message_templates SET academy_id = ${targetId} WHERE academy_id = ${sourceId}
        `;
        updates.templates = `${resTemplates.rowCount}개의 메시지 템플릿이 이전되었습니다.`;

        return NextResponse.json({
            message: `'${targetAcademy[0].academy_name}' 학원으로 데이터 이전이 완료되었습니다.`,
            details: updates
        });

    } catch (error: any) {
        return NextResponse.json({ error: '데이터 이전 중 오류가 발생했습니다.', details: error.message }, { status: 500 });
    }
}
