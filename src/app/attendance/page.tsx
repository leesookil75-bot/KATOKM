"use client";
// Force Rebuild


import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, MessageCircle, Check, Circle, Triangle } from "lucide-react";

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
    const [attendance, setAttendance] = useState<{ [key: string]: { status: string, memo?: string } }>({}); // Updated state structure

    const [view, setView] = useState<ViewMode>("week");
    const [date, setDate] = useState(new Date());
    const [selectedClass, setSelectedClass] = useState("all");

    // Modal State
    const [selectedCell, setSelectedCell] = useState<{ studentId: string, date: string } | null>(null);
    const [tempMemo, setTempMemo] = useState("");

    // Helpers
    const dateStr = date.toISOString().split('T')[0];
    const classes = Array.from(new Set(students.map(s => s.className).filter(Boolean))) as string[];
    const filteredStudents = students.filter(s => selectedClass === "all" ? true : s.className === selectedClass);

    useEffect(() => {
        fetchStudents();
        fetchAttendance();
    }, [date, view]);

    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/students');
            if (res.ok) setStudents(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchAttendance = async () => {
        try {
            const res = await fetch('/api/attendance');
            if (res.ok) {
                const data = await res.json();
                const map: any = {};
                data.forEach((r: any) => {
                    map[`${r.student_id}-${r.date.split('T')[0]}`] = { status: r.status, memo: r.memo };
                });
                setAttendance(map);
            }
        } catch (e) { console.error(e); }
    };

    const handleCellClick = (studentId: string, date: string) => {
        const key = `${studentId}-${date}`;
        const currentData = attendance[key];
        setTempMemo(currentData?.memo || "");
        setSelectedCell({ studentId, date });
    };

    const updateStatus = async (status: string) => {
        if (!selectedCell) return;
        const { studentId, date } = selectedCell;

        // Optimistic Update
        const key = `${studentId}-${date}`;
        setAttendance(prev => ({ ...prev, [key]: { status, memo: tempMemo } }));

        try {
            await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, date, status, memo: tempMemo })
            });
        } catch (e) { console.error(e); }

        setSelectedCell(null);
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
        const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(curr.setDate(diff));
        const days = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    };

    const getMonthDays = () => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
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
                    <h1 className="heading-md">출석부 <span className="text-xs text-gray-400 font-normal">v1.3.7</span></h1>
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
                                    const record = attendance[`${student.id}-${d}`];
                                    const status = record?.status;

                                    return (
                                        <td key={d} className="text-center p-0">
                                            <button
                                                onClick={() => handleCellClick(student.id, d)}
                                                style={{
                                                    width: "100%", height: "40px",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontWeight: 'bold',
                                                    color: status === '출석' ? '#2563eb' : status === '특이사항' ? '#16a34a' : status === '결석' ? '#dc2626' : '#e5e7eb'
                                                }}
                                            >
                                                {status === '출석' ? 'O' : status === '특이사항' ? '△' : status === '결석' ? 'X' : '-'}
                                                {record?.memo && <span style={{ position: 'absolute', bottom: '2px', right: '2px', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#6b7280' }}></span>}
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
                    <div className="card" style={{ width: '90%', maxWidth: '320px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="heading-md">
                                {students.find(s => s.id === selectedCell.studentId)?.name}
                                <span className="text-sm font-normal text-gray-500 ml-2">{selectedCell.date}</span>
                            </h3>
                            <button onClick={() => setSelectedCell(null)}><X size={20} /></button>
                        </div>

                        <div className="mb-8 mt-2" style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center' }}>
                            <button onClick={() => updateStatus('출석')}
                                className="flex flex-col items-center gap-3 p-2 transition-transform active:scale-95 group">
                                <div className="p-4 rounded-full transition-colors" style={{ backgroundColor: 'white', border: '2px solid #eff6ff' }}>
                                    <Circle size={48} color="#2563eb" strokeWidth={3} />
                                </div>
                                <span className="text-sm text-gray-600 font-semibold">출석</span>
                            </button>
                            <button onClick={() => updateStatus('특이사항')}
                                className="flex flex-col items-center gap-3 p-2 transition-transform active:scale-95 group">
                                <div className="p-4 rounded-full transition-colors" style={{ backgroundColor: 'white', border: '2px solid #f0fdf4' }}>
                                    <Triangle size={48} color="#16a34a" strokeWidth={3} />
                                </div>
                                <span className="text-sm text-gray-600 font-semibold">특이사항</span>
                            </button>
                            <button onClick={() => updateStatus('결석')}
                                className="flex flex-col items-center gap-3 p-2 transition-transform active:scale-95 group">
                                <div className="p-4 rounded-full transition-colors" style={{ backgroundColor: 'white', border: '2px solid #fef2f2' }}>
                                    <X size={48} color="#dc2626" strokeWidth={3} />
                                </div>
                                <span className="text-sm text-gray-600 font-semibold">결석</span>
                            </button>
                        </div>

                        <div>
                            <label className="text-sm font-bold text-gray-700 mb-1 block">메모</label>
                            <div style={{ position: 'relative' }}>
                                {!tempMemo && (
                                    <div style={{
                                        position: 'absolute', top: '12px', left: '12px', right: '12px', bottom: '12px',
                                        pointerEvents: 'none', color: '#9ca3af', fontSize: '0.875rem', lineHeight: '1.5',
                                        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px'
                                    }}>
                                        <span>메모 작성 후 위</span>
                                        <Circle size={14} strokeWidth={3} />
                                        <Triangle size={14} strokeWidth={3} />
                                        <X size={14} strokeWidth={3} />
                                        <span>터치하시면 자동저장</span>
                                    </div>
                                )}
                                <textarea
                                    className="input w-full text-sm"
                                    rows={3}
                                    value={tempMemo}
                                    onChange={(e) => setTempMemo(e.target.value)}
                                // Remove standard placeholder to avoid conflict
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
