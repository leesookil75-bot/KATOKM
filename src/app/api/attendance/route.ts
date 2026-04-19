import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const session = await getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = session.user.role;
    const academyId = session.user.id;
    const studentIdParam = searchParams.get('studentId') || session.user.student_id;

    try {
        if (role === 'PARENT' || role === 'STUDENT') {
            if (!studentIdParam) return NextResponse.json({ error: 'Student ID missing' }, { status: 400 });

            // Parent view: specific student history
            const { rows } = await sql`
                SELECT a.date, a.status, a.memo, a.created_at
                FROM attendance a
                WHERE a.student_id = ${studentIdParam}
                ORDER BY a.date DESC
            `;
            return NextResponse.json(rows);
        }

        if (date) {
            // Daily Attendance for this academy
            const { rows } = await sql`
        SELECT a.student_id, a.status, a.memo, s.class_name
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE a.date = ${date}::date AND s.academy_id = ${academyId}
      `;
            return NextResponse.json(rows);
        }

        // Default: Return attendance for ALL students of this academy
        const { rows } = await sql`
            SELECT a.student_id, a.date, a.status, a.memo
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE s.academy_id = ${academyId}
        `;
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const academyId = session.user.id;
        const body = await request.json();
        const { studentId, date, status, memo } = body;

        // Verify student belongs to this academy
        const { rows: studentCheck } = await sql`SELECT id FROM students WHERE id = ${studentId} AND academy_id = ${academyId}`;
        if (studentCheck.length === 0) {
            return NextResponse.json({ error: '접근 권한이 없는 학생입니다.' }, { status: 403 });
        }

        // Check previous status
        const { rows: oldAttendance } = await sql`SELECT status FROM attendance WHERE student_id = ${studentId} AND date = ${date}`;
        const oldStatus = oldAttendance.length > 0 ? oldAttendance[0].status : null;

        const { rows } = await sql`
      INSERT INTO attendance (student_id, date, status, memo)
      VALUES (${studentId}, ${date}, ${status}, ${memo || ''})
      ON CONFLICT (student_id, date) 
      DO UPDATE SET status = ${status}, memo = ${memo || ''}, created_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

        // Update Dream Energy if status changed
        if (oldStatus !== status) {
            let energyDelta = 0;
            if (status === '출석') {
                energyDelta = 0.2;
                
                // 연속 출석 보너스 계산 (LIMIT 50으로 최근 기록 스캔)
                try {
                    const { rows: history } = await sql`
                        SELECT status FROM attendance 
                        WHERE student_id = ${studentId} 
                        ORDER BY date DESC
                        LIMIT 50
                    `;
                    let streak = 0;
                    for (const row of history) {
                        if (row.status === '결석') break; // 결석이 있으면 연속 출석 깨짐
                        if (row.status === '출석' || row.status === '하원') streak++;
                    }
                    // 연속 5일 단위 (5, 10, 15...) 달성 시 0.1점 보너스
                    if (streak > 0 && streak % 5 === 0) {
                        energyDelta += 0.1;
                    }
                } catch (e) {
                    console.error('[Streak Bonus Error]:', e);
                }
            }
            else if (status === '결석') energyDelta = -1.0;
            
            // If they changed from attendance to absence (revert + penalize)
            if (oldStatus === '출석' && status === '하원') energyDelta = -0.2; // just revert
            if (oldStatus === '결석' && status === '출석') energyDelta = 1.2; // revert penalty + reward
            if (oldStatus === '결석' && status !== '결석' && status !== '출석') energyDelta = 1.0; // revert penalty
            if (oldStatus === '출석' && status === '결석') energyDelta = -1.2; // revert reward + penalize

            if (energyDelta !== 0) {
                await sql`
                    UPDATE students 
                    SET dream_energy = GREATEST(0, LEAST(100, COALESCE(dream_energy, 36.5) + ${energyDelta}))
                    WHERE id = ${studentId}
                `;
            }
        }

        // Send Push Notification if status changed
        if (status === '출석' || status === '결석') {
            try {
                const { rows: studentRows } = await sql`SELECT name FROM students WHERE id = ${studentId} `;
                if (studentRows.length > 0) {
                    const studentName = studentRows[0].name;
                    const { sendPushNotification } = await import('@/lib/push');
                    const body = status === '출석'
                        ? `${studentName} 학생이 출석했습니다.`
                        : `${studentName} 학생이 현재 결석 중입니다.`;

                    await sendPushNotification(studentId, {
                        title: '출결 알림',
                        body: body
                    });

                    // Log the PUSH contact
                    try {
                        await sql`
                            INSERT INTO contact_logs (student_id, academy_id, contact_type, action_status)
                            VALUES (${studentId}, ${academyId}, 'PUSH', 'SENT')
                        `;
                    } catch (logErr) {
                        console.error('[Contact Log] Failed:', logErr);
                    }
                }
            } catch (pushErr) {
                console.error('[Push-Admin] Failed:', pushErr);
            }
        }

        return NextResponse.json({ success: true, attendance: rows[0] });
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}
