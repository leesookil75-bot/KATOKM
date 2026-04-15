import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Optional: Verify Vercel Cron Secret here if needed
        // const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return new Response('Unauthorized', { status: 401 });
        // }

        // Fetch all students (In a truly massive scale, we'd paginate this)
        const { rows: students } = await sql`
            SELECT id, name, class_name, academy_id, tuition_due_day 
            FROM students
        `;

        if (students.length === 0) {
            return NextResponse.json({ message: 'No students to process' });
        }

        const studentIds = students.map(s => s.id);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

        // Fetch Attendance for past 30 days
        const { rows: attendance } = await sql`
            SELECT student_id, date, status 
            FROM attendance 
            WHERE date >= ${dateStr}
            ORDER BY student_id ASC, date DESC
        `;

        // Fetch Tuition for current and previous month
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-12
        let prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        let prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

        const { rows: tuition } = await sql`
            SELECT student_id, year, month, status 
            FROM tuition_records 
            WHERE (year = ${currentYear} AND month = ${currentMonth}) 
               OR (year = ${prevYear} AND month = ${prevMonth})
        `;

        // Process each student
        const updatePromises = students.map(async (student) => {
            let score = 0;
            const reasons: string[] = [];

            // 1. Analyze Attendance
            const studentAttendances = attendance.filter(a => a.student_id === student.id);
            let consecutiveAbsences = 0;
            let totalAbsences = 0;
            
            for (let i = 0; i < studentAttendances.length; i++) {
                if (studentAttendances[i].status === '결석') {
                    totalAbsences++;
                    if (i === consecutiveAbsences) consecutiveAbsences++;
                } else if (studentAttendances[i].status === '출석') {
                    if (i === consecutiveAbsences) break; // Break consecutive sequence
                }
            }

            if (consecutiveAbsences >= 3) {
                score += 50;
                reasons.push('최근 3회 이상 연속 결석');
            } else if (consecutiveAbsences === 2) {
                score += 20;
                reasons.push('최근 2회 연속 결석');
            }

            if (totalAbsences > 5) {
                score += 20;
                reasons.push(`최근 한 달 누적 결석 많음 (${totalAbsences}회)`);
            }

            // 2. Analyze Tuition
            const stTuition = tuition.filter(t => t.student_id === student.id);
            const prevTuition = stTuition.find(t => t.year === prevYear && parseInt(t.month) === prevMonth);
            const currTuition = stTuition.find(t => t.year === currentYear && parseInt(t.month) === currentMonth);

            if (prevTuition && prevTuition.status === '미납') {
                score += 40;
                reasons.push('지난달 회비 미납');
            }

            const currentDay = now.getDate();
            if (currTuition && currTuition.status === '미납' && student.tuition_due_day && currentDay > student.tuition_due_day) {
                score += 20;
                reasons.push('이번달 회비 미납 (납부일 경과)');
            }

            // 3. Determine Risk Level
            let riskLevel = 'Green';
            if (score >= 60) riskLevel = 'Red';
            else if (score >= 30) riskLevel = 'Yellow';

            let reasonsJson = JSON.stringify(reasons);

            // 4. Update Database
            return sql`
                UPDATE students 
                SET risk_score = ${score}, 
                    risk_level = ${riskLevel}, 
                    risk_reasons = ${reasonsJson},
                    risk_updated_at = CURRENT_TIMESTAMP
                WHERE id = ${student.id}
            `;
        });

        // Execute all updates concurrently
        await Promise.all(updatePromises);

        return NextResponse.json({ success: true, processed: students.length });
    } catch (error: any) {
        console.error('[CRON Risk Calc] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
