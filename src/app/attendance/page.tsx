"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, MessageCircle, Check } from "lucide-react";

type Student = {
    id: string;
    name: string;
    parentPhone: string;
    className?: string;
};

// "미처리" is treated as 'X' (Absent) visually
type AttendanceStatus = "출석" | "결석";
type ViewMode = "week" | "month";

export default function AttendancePage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<{ [key: string]: string }>({}); // Map: "studentId-date" -> status

    const [view, setView] = useState<ViewMode>("week");
    const [date, setDate] = useState(new Date());
    const [selectedClass, setSelectedClass] = useState("all");

    // Modal State
    const [selectedCell, setSelectedCell] = useState<{ studentId: string, date: string } | null>(null);

    // Helpers
    const dateStr = date.toISOString().split('T')[0];
    const classes = Array.from(new Set(students.map(s => s.className).filter(Boolean))) as string[];
    const filteredStudents = students.filter(s => selectedClass === "all" ? true : s.className === selectedClass);

    useEffect(() => {
        fetchStudents();
        fetchAttendance();
    }, [date, view]); // Re-fetch when date/view changes

    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/students');
            if (res.ok) setStudents(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchAttendance = async () => {
        // In a real app, we'd fetch range. currently we just trust the global state/cache or simple fetch
        // For MVP, lets assume we fetch all or just rely on what we have (mock refresh)
        try {
            const res = await fetch('/api/attendance'); // This gets ALL. Optimized would get by range.
            if (res.ok) {
                const data = await res.json();
                const map: any = {};
                data.forEach((r: any) => {
                    map[`${r.student_id}-${r.date.split('T')[0]}`] = r.status;
                });
                setAttendance(map);
            }
        } catch (e) { console.error(e); }
    };

    const updateStatus = async (studentId: string, targetDate: string, status: string, sendSms: boolean) => {
        // Optimistic Update
        const key = `${studentId}-${targetDate}`;
        setAttendance(prev => ({ ...prev, [key]: status }));
        setSelectedCell(null); // Close modal

        try {
            await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, date: targetDate, status })
            });

            if (sendSms) {
                const student = students.find(s => s.id === studentId);
                if (student) {
                    const msg = `[출결알림] ${student.name} 학생이 출석하였습니다.`;
                    // Open SMS App
                    const ua = navigator.userAgent;
                    const sep = ua.match(/iPhone|iPad|iPod/i) ? '&' : '?';
                    window.location.href = `sms:${student.parentPhone}${sep}body=${encodeURIComponent(msg)}`;
                }
            }
        } catch (e) { console.error(e); }
    };

    const changeDate = (direction: number) => {
        const newDate = new Date(date);
        if (view === 'week') newDate.setDate(newDate.getDate() + (direction * 7));
        else newDate.setMonth(newDate.getMonth() + direction);
        setDate(newDate);
    };

    // Date Generators
    const getWeekDays = () => {
        const curr = new Date(date);
        const day = curr.getDay();
        const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Mon
        const monday = new Date(curr.setDate(diff));
        const days = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    };

    // Simple Month generator (just days in month)
    const getMonthDays = () => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i); // Local time
            // Manual format to avoid timezone shifts
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            days.push(`${y}-${m}-${day}`);
        }
        return days;
    };

    const displayDays = view === 'week' ? getWeekDays() : getMonthDays();
    const currentDateTitle = view === 'week'
        ? `${getWeekDays()[0]} ~ ${getWeekDays()[4].slice(5)}`
        : `${date.getFullYear()}년 ${date.getMonth() + 1}월`;


    return (
        <div className="main flex-col gap-md" style={{ position: 'relative' }}>
            {/* Header */}
            <div className="card p-4 flex-col gap-sm">
                <div className="flex-center justify-between">
                    <h1 className="heading-md">출석부</h1>
                    <div className="flex-center gap-xs bg-gray-100 p-1 rounded-md">
                        <button className={`btn text-xs ${view === 'week' ? 'btn-primary' : ''}`}
                            onClick={() => setView('week')} style={{ padding: "0.25rem 0.5rem" }}>주간</button>
                        <button className={`btn text-xs ${view === 'month' ? 'btn-primary' : ''}`}
                            onClick={() => setView('month')} style={{ padding: "0.25rem 0.5rem" }}>월간</button>
                    </div>
                </div>

                <div className="flex-center justify-between">
                    <div className="flex-center gap-sm">
                        <button onClick={() => changeDate(-1)} className="p-1"><ChevronLeft size={20} /></button>
                        <span className="font-bold text-sm">{currentDateTitle}</span>
                        <button onClick={() => changeDate(1)} className="p-1"><ChevronRight size={20} /></button>
                    </div>
                    <select className="input text-sm p-1" style={{ width: "auto" }}
                        value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                        <option value="all">전체 반</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="table-container" style={{ maxHeight: "70vh", overflow: "auto" }}>
                <table className="table text-xs">
                    <thead>
                        <tr>
                            <th style={{ position: 'sticky', left: 0, zIndex: 20, background: '#f3f4f6', minWidth: '80px' }}>이름</th>
                            {displayDays.map(d => (
                                <th key={d} className="text-center" style={{ minWidth: view === 'month' ? '30px' : 'auto' }}>
                                    {view === 'week' ? d.slice(5) : d.slice(8)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map(student => (
                            <tr key={student.id}>
                                <td style={{ position: 'sticky', left: 0, zIndex: 10, background: 'white', fontWeight: '600' }}>
                                    {student.name}
                                </td>
                                {displayDays.map(d => {
                                    const status = attendance[`${student.id}-${d}`];
                                    const isPresent = status === '출석';

                                    return (
                                        <td key={d} className="text-center p-0">
                                            <button
                                                onClick={() => {
                                                    // If already present, toggle to absent? Or just do nothing/open modal too?
                                                    // Spec: Click default 'X' -> "O" or "O+SMS".
                                                    // Let's open modal for any interaction for clarity, or toggle if present.
                                                    if (isPresent) {
                                                        updateStatus(student.id, d, '결석', false); // Toggle off
                                                    } else {
                                                        setSelectedCell({ studentId: student.id, date: d });
                                                    }
                                                }}
                                                style={{
                                                    width: "100%", height: "40px",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    color: isPresent ? 'var(--primary)' : '#e5e7eb',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {isPresent ? 'O' : 'X'}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Action Sheet / Modal */}
            {selectedCell && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setSelectedCell(null)}>
                    <div className="card" style={{ width: '90%', maxWidth: '300px' }} onClick={e => e.stopPropagation()}>
                        <h3 className="heading-md mb-4 text-center">출석 처리</h3>
                        <div className="flex-col gap-sm">
                            <button onClick={() => updateStatus(selectedCell.studentId, selectedCell.date, '출석', false)}
                                className="btn btn-secondary justify-between w-full p-4">
                                <span>출석만 체크 (O)</span>
                                <Check size={18} />
                            </button>
                            <button onClick={() => updateStatus(selectedCell.studentId, selectedCell.date, '출석', true)}
                                className="btn btn-primary justify-between w-full p-4">
                                <span>출석 + 문자전송</span>
                                <MessageCircle size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
type Student = {
    id: string;
    name: string;
    parentPhone: string;
    className?: string;
};

type AttendanceStatus = "출석" | "결석" | "지각" | "조퇴" | "미처리";
type ViewMode = "day" | "week";

export default function AttendancePage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<{ [key: string]: any }>({}); // Map: "studentId-date" -> status

    const [view, setView] = useState<ViewMode>("day");
    const [date, setDate] = useState(new Date());
    const [selectedClass, setSelectedClass] = useState("all");

    // Computed
    const dateStr = date.toISOString().split('T')[0];
    const classes = Array.from(new Set(students.map(s => s.className).filter(Boolean))) as string[];

    // Filtered Students
    const filteredStudents = students.filter(s =>
        selectedClass === "all" ? true : s.className === selectedClass
    );

    // Initial Load
    useEffect(() => {
        fetchStudents();
        fetchAttendance(); // Fetch range based on view
    }, []);

    // Refresh when view/date changes
    useEffect(() => {
        fetchAttendance();
    }, [date, view]);

    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/students');
            if (res.ok) setStudents(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchAttendance = async () => {
        // Mock fetch for now, TODO: implement fetch with date range
        // For Day view, we just check local state or fetch specific day
        // This prototype focuses on UI structure first
    };

    const handleStatusChange = async (studentId: string, status: AttendanceStatus, targetDate: string) => {
        const key = `${studentId}-${targetDate}`;
        setAttendance(prev => ({ ...prev, [key]: status }));

        try {
            await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, date: targetDate, status })
            });
        } catch (e) { console.error(e); }
    };

    const changeDate = (days: number) => {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + days);
        setDate(newDate);
    };

    // Helper for Weekly View
    const getWeekDays = () => {
        const curr = new Date(date); // Copy
        const days = [];
        // Adjust to Monday
        const day = curr.getDay();
        const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(curr.setDate(diff));

        for (let i = 0; i < 5; i++) { // Mon-Fri
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    };

    return (
        <div className="main flex-col gap-md">
            {/* Header Controls */}
            <div className="card p-4 flex-col gap-sm">
                <div className="flex-center justify-between">
                    <h1 className="heading-md">출석부</h1>
                    <div className="flex-center gap-xs bg-gray-100 p-1 rounded-md">
                        <button
                            className={`btn text-xs ${view === 'day' ? 'btn-primary' : ''}`}
                            onClick={() => setView('day')}
                            style={{ padding: "0.25rem 0.5rem" }}
                        >일간</button>
                        <button
                            className={`btn text-xs ${view === 'week' ? 'btn-primary' : ''}`}
                            onClick={() => setView('week')}
                            style={{ padding: "0.25rem 0.5rem" }}
                        >주간</button>
                    </div>
                </div>

                <div className="flex-center justify-between">
                    <div className="flex-center gap-sm">
                        <button onClick={() => changeDate(view === 'day' ? -1 : -7)} className="p-1"><ChevronLeft size={20} /></button>
                        <span className="font-bold">
                            {view === 'day' ? dateStr : '이번 주'}
                        </span>
                        <button onClick={() => changeDate(view === 'day' ? 1 : 7)} className="p-1"><ChevronRight size={20} /></button>
                    </div>

                    <select
                        className="input text-sm p-1"
                        style={{ width: "auto" }}
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="all">전체 반</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* View Content */}
            {view === 'day' ? (
                <div className="flex-col gap-sm">
                    {filteredStudents.map(student => (
                        <div key={student.id} className="card p-4 flex-center justify-between">
                            <div>
                                <div className="text-xs text-primary mb-1">{student.className || "반 미배정"}</div>
                                <h3 className="heading-md">{student.name}</h3>
                            </div>
                            <div className="flex-center gap-xs">
                                {(["출석", "결석", "지각"] as AttendanceStatus[]).map(status => {
                                    const current = attendance[`${student.id}-${dateStr}`] || "미처리";
                                    const isActive = current === status;
                                    return (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusChange(student.id, status, dateStr)}
                                            className={`btn text-xs ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                                            style={{
                                                opacity: isActive ? 1 : 0.5,
                                                padding: "0.4rem 0.6rem"
                                            }}
                                        >
                                            {status}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Weekly View (Table) */
                <div className="table-container">
                    <table className="table text-xs">
                        <thead>
                            <tr>
                                <th style={{ position: 'sticky', left: 0, zIndex: 20, background: '#f3f4f6' }}>이름</th>
                                {getWeekDays().map(d => (
                                    <th key={d} className="text-center">{d.slice(5)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => (
                                <tr key={student.id}>
                                    <td style={{ position: 'sticky', left: 0, zIndex: 10, background: 'white', fontWeight: 'bold' }}>
                                        {student.name}
                                    </td>
                                    {getWeekDays().map(d => {
                                        const status = attendance[`${student.id}-${d}`];
                                        return (
                                            <td key={d} className="text-center p-1">
                                                <button
                                                    onClick={() => handleStatusChange(student.id, status === '출석' ? '결석' : '출석', d)}
                                                    style={{
                                                        width: "24px", height: "24px", borderRadius: "50%",
                                                        background: status === '출석' ? 'var(--primary)' : (status === '결석' ? '#ef4444' : '#e5e7eb'),
                                                        color: 'white', fontSize: '10px'
                                                    }}
                                                >
                                                    {status === '출석' ? 'O' : (status === '결석' ? 'X' : '-')}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
