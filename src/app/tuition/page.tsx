"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Student {
    id: string;
    name: string;
    className: string;
}

interface TuitionRecord {
    id: string;
    student_id: string;
    year: number;
    month: number;
    status: 'paid' | 'unpaid';
    payment_date: string | null;
}

export default function TuitionPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
    const [tuitionRecords, setTuitionRecords] = useState<Record<string, TuitionRecord>>({});
    const [selectedClass, setSelectedClass] = useState("all");
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCell, setSelectedCell] = useState<{ studentId: string; month: number } | null>(null);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchData();
    }, [year]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [studentsRes, classesRes, tuitionRes] = await Promise.all([
                fetch("/api/students"),
                fetch("/api/classes"),
                fetch(`/api/tuition?year=${year}`)
            ]);

            const studentsData = await studentsRes.json();
            const classesData = await classesRes.json();
            const tuitionData = await tuitionRes.json();

            // Transform students to match interface
            // API returns array directly
            const validStudents = Array.isArray(studentsData) ? studentsData.map((s: any) => ({
                id: s.id,
                name: s.name,
                className: s.class_name || "반 없음"
            })) : [];

            // Transform classes
            // API returns array directly
            const validClasses = Array.isArray(classesData) ? classesData : [];

            // Transform tuition records to map: "studentId-month" -> Record
            const recordMap: Record<string, TuitionRecord> = {};
            if (tuitionData && Array.isArray(tuitionData.records)) {
                tuitionData.records.forEach((r: any) => {
                    recordMap[`${r.student_id}-${r.month}`] = r;
                });
            }

            setStudents(validStudents);
            setClasses(validClasses);
            setTuitionRecords(recordMap);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = selectedClass === "all"
        ? students
        : students.filter(s => s.className === selectedClass);

    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const handleCellClick = (studentId: string, month: number) => {
        const key = `${studentId}-${month}`;
        const record = tuitionRecords[key];

        // Default payment date to existing record's date or today
        const defaultDate = record?.payment_date
            ? new Date(record.payment_date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

        setSelectedCell({ studentId, month });
        setPaymentDate(defaultDate);
        setModalOpen(true);
    };

    const handleUpdateStatus = async (status: 'paid' | 'unpaid') => {
        if (!selectedCell) return;

        try {
            const { studentId, month } = selectedCell;
            const res = await fetch("/api/tuition", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_id: studentId,
                    year,
                    month,
                    status,
                    payment_date: status === 'paid' ? paymentDate : null
                })
            });

            if (res.ok) {
                const updatedRecord = await res.json();
                setTuitionRecords(prev => ({
                    ...prev,
                    [`${studentId}-${month}`]: updatedRecord.record
                }));
                setModalOpen(false);
            }
        } catch (error) {
            console.error("Failed to update status", error);
            alert("업데이트에 실패했습니다.");
        }
    };

    return (
        <div className="main flex-col gap-md" style={{ height: "100vh", overflow: "hidden" }}>
            {/* Header */}
            <header className="flex-center justify-between p-4 border-b bg-white z-10">
                <Link href="/" className="btn text-sm">← 홈</Link>
                <div className="flex-center gap-4">
                    <button onClick={() => setYear(y => y - 1)}><ChevronLeft /></button>
                    <h1 className="heading-md">{year}년 수강료 관리</h1>
                    <button onClick={() => setYear(y => y + 1)}><ChevronRight /></button>
                </div>
                <div style={{ width: "40px" }}></div>
            </header>

            {/* Filters (Sticky) */}
            <div className="p-4 pb-0">
                <select
                    className="input w-48 text-sm p-2"
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                >
                    <option value="all">전체 반</option>
                    {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto p-4 table-container relative">
                <table className="table text-sm w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                    <thead className="sticky top-0 z-20 bg-gray-50 shadow-sm">
                        <tr>
                            <th className="sticky left-0 z-30 bg-gray-50 border-r" style={{ minWidth: '80px' }}>이름</th>
                            <th className="sticky z-30 bg-gray-50 border-r" style={{ left: '80px', minWidth: '100px' }}>반</th>
                            {months.map(m => (
                                <th key={m} className="text-center min-w-[60px]">{m}월</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map(student => (
                            <tr key={student.id} className="hover:bg-gray-50">
                                <td className="sticky left-0 z-10 bg-white border-r font-bold">{student.name}</td>
                                <td className="sticky z-10 bg-white border-r text-xs text-sub" style={{ left: '80px' }}>{student.className}</td>
                                {months.map(m => {
                                    const key = `${student.id}-${m}`;
                                    const record = tuitionRecords[key];
                                    const isPaid = record?.status === 'paid';

                                    return (
                                        <td
                                            key={m}
                                            className={`text-center cursor-pointer hover:opacity-80 transition-colors ${isPaid ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-400'
                                                }`}
                                            onClick={() => handleCellClick(student.id, m)}
                                        >
                                            {isPaid ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold">납부</span>
                                                    <span className="text-[10px] text-blue-400">
                                                        {record.payment_date ? new Date(record.payment_date).getMonth() + 1 + '/' + new Date(record.payment_date).getDate() : ''}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs">미납</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <NavBar />

            {/* Modal */}
            {modalOpen && selectedCell && (
                <div className="fixed inset-0 bg-black/50 flex-center z-50 p-4">
                    <div className="card w-full max-w-sm flex flex-col gap-4">
                        <h3 className="heading-md text-center">
                            {year}년 {selectedCell.month}월 수강료 처리
                        </h3>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold">납부 날짜</label>
                            <input
                                type="date"
                                className="input"
                                value={paymentDate}
                                onChange={e => setPaymentDate(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <button
                                className="btn bg-gray-200 hover:bg-gray-300 text-gray-800"
                                onClick={() => handleUpdateStatus('unpaid')}
                            >
                                미납 처리
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleUpdateStatus('paid')}
                            >
                                납부 완료
                            </button>
                        </div>
                        <button className="text-sm text-sub underline mt-2 text-center" onClick={() => setModalOpen(false)}>
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
