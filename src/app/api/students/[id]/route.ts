import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const academyId = session.user.id;
        const id = params.id;

        const body = await request.json();
        const { name, parentPhone, studentPhone, passcode, memo, className, tuition_due_day } = body;

        const { rows } = await sql`
      UPDATE students
      SET name = ${name}, 
          parent_phone = ${parentPhone}, 
          student_phone = ${studentPhone || null},
          passcode = ${passcode}, 
          memo = ${memo}, 
          class_name = ${className || ''},
          tuition_due_day = ${tuition_due_day || null}
      WHERE id = ${id} AND academy_id = ${academyId}
      RETURNING *;
    `;

        if (rows.length === 0) {
            return NextResponse.json({ error: '학생을 찾을 수 없거나 수정 권한이 없습니다.' }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (error: any) {
        console.error(`[PUT ${params.id}] Error:`, error);
        return NextResponse.json({ error: error.message || '학생 정보를 수정하는데 실패했습니다.' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const academyId = session.user.id;

        const id = params.id;
        const { rowCount } = await sql`DELETE FROM students WHERE id = ${id} AND academy_id = ${academyId}`;

        if (rowCount === 0) {
            return NextResponse.json({ error: '학생을 찾을 수 없거나 삭제 권한이 없습니다.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error: any) {
        console.error(`[DELETE ${params.id}] Error:`, error);
        return NextResponse.json({ error: error.message || '학생을 삭제하는데 실패했습니다.' }, { status: 500 });
    }
}
