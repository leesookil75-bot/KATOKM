"use client";

import { useState, useEffect } from "react";
import { Send, Copy, Plus, Trash2, Users, Filter, ChevronDown } from "lucide-react";
import Link from 'next/link';

type Student = {
    id: string;
    name: string;
    parentPhone: string;
    className?: string; // class_name from DB
};

type Template = {
    id: number;
    content: string;
};

type AttendanceStatus = "출석" | "결석" | "지각" | "조퇴" | "미처리";

export default function MessagePage() {
    // Data State
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<{ id: number, name: string }[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [attendance, setAttendance] = useState<{ [key: string]: string }>({});
    const [tuitionUnpaidIds, setTuitionUnpaidIds] = useState<Set<string>>(new Set());

    // UI State
    const [selectedClass, setSelectedClass] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all"); // all, absent, present, tuition_unpaid
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [message, setMessage] = useState("");
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [newTemplateContent, setNewTemplateContent] = useState("");

    // Date for context (default today)
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [resStudents, resClasses, resTemplates, resAttendance, resTuition] = await Promise.all([
                fetch('/api/students'),
                fetch('/api/classes'),
                fetch('/api/message-templates'),
                fetch(`/api/attendance?date=${today}`),
                fetch(`/api/tuition?year=${currentYear}`)
            ]);

            let studentsData: Student[] = [];

            if (resStudents.ok) {
                const data = await resStudents.json();
                studentsData = data;
                setStudents(data);
            }
            if (resClasses.ok) setClasses(await resClasses.json());
            if (resTemplates.ok) setTemplates(await resTemplates.json());

            if (resAttendance.ok) {
                const data = await resAttendance.json();
                const map: any = {};
                data.forEach((r: any) => map[r.student_id] = r.status);
                setAttendance(map);
            }

            if (resTuition.ok) {
                const data = await resTuition.json();
                // Find students who have PAID for current month
                const paidStudentIds = new Set(
                    data.records
                        .filter((r: any) => r.month === currentMonth && r.status === 'paid')
                        .map((r: any) => r.student_id)
                );

                // Identify students who have NOT paid
                // We need the full student list to determine who is missing from paid list
                // If studentsData is available here use it, otherwise rely on state update flow?
                // Actually easier to just store paid IDs and invert logic in filter

                // BUT wait, we need to know who is unpaid. Unpaid = All Students - Paid Students.
                // So let's just store the Paid IDs for the current month.
                // Actually, let's store the UNPAID IDs directly for easier filtering.
                if (studentsData.length > 0) {
                    const unpaid = new Set(
                        studentsData
                            .filter((s: any) => !paidStudentIds.has(s.id))
                            .map((s: any) => s.id)
                    );
                    setTuitionUnpaidIds(unpaid);
                }
            }
        } catch (e) { console.error(e); }
    };

    // Filter Logic
    const filteredStudents = students.filter(s => {
        const matchClass = selectedClass === "all" || s.className === selectedClass;
        const status = attendance[s.id] || "미처리";

        let matchStatus = true;
        if (selectedStatus === "absent") matchStatus = status === "결석" || status === "미처리";
        else if (selectedStatus === "present") matchStatus = status === "출석";
        else if (selectedStatus === "tuition_unpaid") matchStatus = tuitionUnpaidIds.has(s.id);

        return matchClass && matchStatus;
    });

    // Selection Handlers
    const toggleSelectAll = () => {
        if (selectedStudentIds.size === filteredStudents.length) {
            setSelectedStudentIds(new Set());
        } else {
            setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
        }
    };

    const toggleStudent = (id: string) => {
        const newSet = new Set(selectedStudentIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedStudentIds(newSet);
    };

    // Template Handlers
    const handleAddTemplate = async () => {
        if (!newTemplateContent.trim()) return;
        try {
            const res = await fetch('/api/message-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newTemplateContent })
            });
            if (res.ok) {
                setNewTemplateContent("");
                // Refresh templates
                const updated = await fetch('/api/message-templates');
                setTemplates(await updated.json());
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteTemplate = async (id: number) => {
        if (!confirm("이 템플릿을 삭제하시겠습니까?")) return;
        try {
            await fetch(`/api/message-templates?id=${id}`, { method: 'DELETE' });
            setTemplates(prev => prev.filter(t => t.id !== id));
        } catch (e) { console.error(e); }
    };

    const applyTemplate = (content: string) => {
        setMessage(content);
        setIsTemplateModalOpen(false);
    };

    // Send Logic
    const handleSend = () => {
        const targets = students.filter(s => selectedStudentIds.has(s.id));
        if (targets.length === 0) return alert("받는 사람을 선택해주세요.");

        const phones = targets.map(s => s.parentPhone).join(';'); // Android/iOS delimiter check? usually ; or ,

        // Mobile only mostly
        const ua = navigator.userAgent;
        const sep = ua.match(/iPhone|iPad|iPod/i) ? '&' : '?';

        // Note: Bulk SMS via sms: protocol is limited. 
        // iOS: sms:open?addresses=1,2,3...
        // Android: sms:1,2,3?body=...
        // Let's try standard comma separated.

        const phoneStr = targets.map(s => s.parentPhone).join(',');
        window.location.href = `sms:${phoneStr}${sep}body=${encodeURIComponent(message)}`;
    };

    return (
        <div className="main flex-col gap-md" style={{ height: "100vh", overflow: "hidden" }}>
            {/* Header */}
            <header className="flex-center justify-between p-4 border-b bg-white z-10 shrink-0">
                <Link href="/" className="btn text-sm">← 홈</Link>
                <h1 className="heading-md">알림 전송</h1>
                <div style={{ width: "40px" }}></div>
            </header>

            {/* Content Container: Column on Mobile, Row on Desktop */}
            <div className="split-layout p-4">

                {/* Left: Student List & Filters */}
                <div className="card split-panel-left gap-sm">

                    {/* Filters */}
                    <div className="flex-center gap-md mb-2 shrink-0">
                        <select className="input text-sm p-2 flex-1" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            <option value="all">전체 반</option>
                            {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <select className="input text-sm p-2 flex-1" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                            <option value="all">전체 상태</option>
                            <option value="absent">결석/미처리</option>
                            <option value="present">출석</option>
                            <option value="tuition_unpaid">수강료 미납 ({new Date().getMonth() + 1}월)</option>
                        </select>
                    </div>

                    {/* Select All Bar */}
                    <div className="flex-center justify-between text-xs text-sub border-b pb-2 shrink-0">
                        <label className="flex-center gap-2 cursor-pointer">
                            <input type="checkbox"
                                checked={filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length}
                                onChange={toggleSelectAll}
                            />
                            <span>전체 선택 ({filteredStudents.length}명)</span>
                        </label>
                        <span>{selectedStudentIds.size}명 선택됨</span>
                    </div>

                    {/* Table List */}
                    <div className="table-container flex-1 overflow-y-auto">
                        <table className="table text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th style={{ width: "40px", textAlign: "center" }}>
                                        <input type="checkbox"
                                            checked={filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th>이름/반</th>
                                    <th>상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map(student => (
                                    <tr key={student.id}
                                        onClick={() => toggleStudent(student.id)}
                                        className={`cursor-pointer ${selectedStudentIds.has(student.id) ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                                    >
                                        <td className="text-center" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox"
                                                checked={selectedStudentIds.has(student.id)}
                                                onChange={() => toggleStudent(student.id)}
                                            />
                                        </td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-800">{student.name}</span>
                                                <span className="text-xs text-gray-500">{student.className || "-"}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`text-xs px-2 py-1 rounded-full ${attendance[student.id] === '출석' ? 'bg-green-100 text-green-700' :
                                                attendance[student.id] === '결석' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {attendance[student.id] || "미처리"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Message Input */}
                <div className="card split-panel-right gap-md">
                    <div className="flex-center justify-between shrink-0">
                        <h3 className="heading-sm">메시지 작성</h3>
                        <button className="btn btn-secondary text-xs flex-center gap-1" onClick={() => setIsTemplateModalOpen(true)}>
                            <Plus size={14} /> 템플릿
                        </button>
                    </div>

                    <textarea
                        className="input flex-1 p-4 resize-none leading-relaxed text-sm"
                        placeholder="전송할 내용을 입력하세요."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    />

                    <div className="action-buttons">
                        <button className="btn btn-secondary py-3 flex-center gap-2" onClick={() => {
                            navigator.clipboard.writeText(message);
                            alert("복사되었습니다.");
                        }}>
                            <Copy size={18} /> 내용 복사
                        </button>
                        <button className="btn btn-primary py-3 flex-center gap-2" onClick={handleSend}>
                            <Send size={18} /> 문자 전송
                        </button>
                    </div>
                </div>
            </div>

            {/* Template Modal */}
            {isTemplateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex-center z-50 p-4">
                    <div className="card w-full max-w-md max-h-[80vh] flex flex-col">
                        <div className="flex-center justify-between mb-4 shrink-0">
                            <h3 className="heading-md">메시지 템플릿</h3>
                            <button onClick={() => setIsTemplateModalOpen(false)}>✕</button>
                        </div>

                        {/* Valid Templates List */}
                        <div className="flex-col gap-2 overflow-y-auto flex-1 mb-4" style={{ minHeight: "200px" }}>
                            {templates.length === 0 ? (
                                <p className="text-center text-sub py-8">저장된 템플릿이 없습니다.</p>
                            ) : (
                                templates.map(t => (
                                    <div key={t.id} className="border rounded p-3 hover:bg-gray-50 group relative">
                                        <p className="text-sm whitespace-pre-wrap cursor-pointer" onClick={() => applyTemplate(t.content)}>
                                            {t.content}
                                        </p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }}
                                            className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add New */}
                        <div className="border-t pt-4 shrink-0">
                            <textarea
                                className="input w-full p-2 text-sm mb-2"
                                rows={3}
                                placeholder="새로운 템플릿 내용을 입력하세요..."
                                value={newTemplateContent}
                                onChange={e => setNewTemplateContent(e.target.value)}
                            />
                            <button
                                className="btn btn-primary w-full"
                                onClick={handleAddTemplate}
                                disabled={!newTemplateContent.trim()}
                            >
                                + 템플릿 저장하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
