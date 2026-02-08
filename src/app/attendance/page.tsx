"use client";

import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Student = {
    id: string;
    name: string;
    parentPhone: string;
};

type AttendanceStatus = "출석" | "결석" | "지각" | "조퇴" | "미처리";

export default function AttendancePage() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<{ [key: string]: AttendanceStatus }>({});
    const [date, setDate] = useState("");

    // Load students
    useEffect(() => {
        // Set date on client side to avoid hydration mismatch
        const today = new Date().toISOString().split('T')[0];
        setDate(today);

        const saved = localStorage.getItem("students");
        if (saved) {
            const parsedStudents = JSON.parse(saved);
            setStudents(parsedStudents);

            // Initialize attendance state for today if not already set
            const savedAttendance = localStorage.getItem(`attendance-${today}`);
            if (savedAttendance) {
                setAttendance(JSON.parse(savedAttendance));
            } else {
                const initialStatus: { [key: string]: AttendanceStatus } = {};
                parsedStudents.forEach((s: Student) => initialStatus[s.id] = "미처리");
                setAttendance(initialStatus); // Don't save to local storage yet, only on change
            }
        }
    }, []);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        const newAttendance = { ...attendance, [studentId]: status };
        setAttendance(newAttendance);
        localStorage.setItem(`attendance-${date}`, JSON.stringify(newAttendance));
    };


    return (
        <div className="main flex-col gap-md">
            <header className="flex-center justify-between">
                <h1 className="heading-lg">오늘의 출석</h1>
                <div className="text-sub font-semibold">{date}</div>
            </header>

            {students.length === 0 ? (
                <div className="card flex-center flex-col gap-md p-8 text-center">
                    <p className="text-muted">등록된 학생이 없습니다.</p>
                    <Link href="/students" className="btn btn-primary">
                        학생 등록하러 가기
                    </Link>
                </div>
            ) : (
                <div className="flex-col gap-sm">
                    {students.map(student => (
                        <div key={student.id} className="card" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "1rem" }}>
                            <div style={{ flex: 1 }}>
                                <h3 className="heading-md">{student.name}</h3>
                                <p className="text-xs text-muted">{student.parentPhone}</p>
                            </div>

                            <div className="flex-center gap-sm">
                                {(["출석", "결석", "지각"] as AttendanceStatus[]).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(student.id, status)}
                                        className="btn text-xs"
                                        style={{
                                            padding: "0.4rem 0.8rem",
                                            backgroundColor: attendance[student.id] === status ? 'var(--primary)' : 'var(--bg-main)',
                                            color: attendance[student.id] === status ? 'white' : 'var(--text-sub)',
                                            border: attendance[student.id] === status ? '1px solid var(--primary)' : '1px solid var(--border)',
                                        }}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ position: "fixed", bottom: "0", left: "0", right: "0", padding: "1rem", backgroundColor: "var(--bg-card)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "center" }}>
                <Link href="/message" className="btn btn-primary" style={{ width: "100%", maxWidth: "600px" }}>
                    알림 전송하러 가기 →
                </Link>
            </div>
            <div style={{ height: "80px" }}></div> {/* Spacer for fixed bottom bar */}
        </div>
    );
}
