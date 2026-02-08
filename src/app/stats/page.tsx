"use client";

import { useState, useEffect } from "react";
import { BarChart2, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Student = {
    id: string;
    name: string;
};

type AttendanceStatus = "출석" | "결석" | "지각" | "조퇴" | "미처리";
type DailyRecord = { [studentId: string]: AttendanceStatus };

export default function StatisticsPage() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [monthlyStats, setMonthlyStats] = useState<{ [studentId: string]: { present: number, late: number, absent: number } }>({});

    // Calculate stats for the current month
    useEffect(() => {
        // Avoid hydration mismatch by only running this on client mount
        setStudents(prev => {
            const savedStudents = localStorage.getItem("students");
            if (savedStudents) {
                const parsed = JSON.parse(savedStudents);
                return parsed;
            }
            return [];
        });
    }, []);

    // Update stats whenever students or date changes
    useEffect(() => {
        if (students.length > 0) {
            calculateStats(students, currentDate);
        }
    }, [students, currentDate]);


    const calculateStats = (studentList: Student[], date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-based
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const stats: { [studentId: string]: { present: number, late: number, absent: number } } = {};

        studentList.forEach(s => {
            stats[s.id] = { present: 0, late: 0, absent: 0 };
        });

        for (let day = 1; day <= daysInMonth; day++) {
            const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dailyRecordJson = localStorage.getItem(`attendance-${dayString}`);

            if (dailyRecordJson) {
                const dailyRecord: DailyRecord = JSON.parse(dailyRecordJson);
                Object.entries(dailyRecord).forEach(([studentId, status]) => {
                    if (stats[studentId]) {
                        if (status === '출석') stats[studentId].present++;
                        else if (status === '지각') stats[studentId].late++;
                        else if (status === '결석') stats[studentId].absent++;
                        else if (status === '조퇴') stats[studentId].present++; // Count leaving early as present for now
                    }
                });
            }
        }
        setMonthlyStats(stats);
    };

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
    };

    return (
        <div className="main flex-col gap-md">
            <header className="flex-center justify-between" style={{ marginBottom: "1rem" }}>
                <Link href="/" className="btn btn-secondary text-sm">← 홈</Link>
                <div className="flex-center gap-md">
                    <button onClick={() => changeMonth(-1)} className="btn p-2"><ChevronLeft /></button>
                    <h1 className="heading-md">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h1>
                    <button onClick={() => changeMonth(1)} className="btn p-2"><ChevronRight /></button>
                </div>
                <div style={{ width: "60px" }}></div> {/* Spacer */}
            </header>

            {students.length === 0 ? (
                <div className="card flex-center p-8 text-muted">
                    등록된 학생이 없습니다.
                </div>
            ) : (
                <div className="flex-col gap-sm">
                    {students.map(student => {
                        const stat = monthlyStats[student.id] || { present: 0, late: 0, absent: 0 };
                        const totalDays = stat.present + stat.late + stat.absent; // Only count recorded days? Or all business days?
                        // Let's use total recorded actions for now
                        const attendanceRate = totalDays > 0 ? Math.round(((stat.present + stat.late) / totalDays) * 100) : 0;

                        return (
                            <div key={student.id} className="card flex-col gap-sm p-4">
                                <div className="flex-center justify-between w-full">
                                    <h3 className="heading-md">{student.name}</h3>
                                    <span className="text-sm font-bold text-primary">{attendanceRate}% ({totalDays}일)</span>
                                </div>

                                <div style={{ width: "100%", backgroundColor: "#e5e7eb", borderRadius: "9999px", height: "0.6rem" }}>
                                    <div style={{ width: `${attendanceRate}%`, backgroundColor: "var(--primary)", height: "100%", borderRadius: "9999px" }}></div>
                                </div>

                                <div className="flex justify-around text-sm text-sub mt-2 w-full">
                                    <div className="flex-col items-center">
                                        <span className="font-bold text-green-600">{stat.present}</span>
                                        <span className="text-xs">출석</span>
                                    </div>
                                    <div className="flex-col items-center">
                                        <span className="font-bold text-yellow-600">{stat.late}</span>
                                        <span className="text-xs">지각</span>
                                    </div>
                                    <div className="flex-col items-center">
                                        <span className="font-bold text-red-600">{stat.absent}</span>
                                        <span className="text-xs">결석</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
