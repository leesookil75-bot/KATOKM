"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Edit } from "lucide-react";

type Student = {
    id: string;
    name: string;
    parentPhone: string;
    passcode: string;
    memo: string;
    className?: string;
    tuition_due_day?: number; // New field
};

export default function StudentManager() {
    const [students, setStudents] = useState<Student[]>([]);
    const [classList, setClassList] = useState<{ id: number, name: string }[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState<Student>({
        id: "",
        name: "",
        parentPhone: "",
        passcode: "",
        memo: "",
        className: "",
        tuition_due_day: 0
    });

    // Fetch students & classes
    const fetchStudents = useCallback(async () => {
        try {
            const res = await fetch('/api/students');
            if (res.ok) setStudents(await res.json());
        } catch (error) { console.error("Failed to fetch students", error); }
    }, []);

    const fetchClasses = useCallback(async () => {
        try {
            const res = await fetch('/api/classes');
            if (res.ok) setClassList(await res.json());
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        fetchStudents();
        fetchClasses();
    }, [fetchStudents, fetchClasses]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = formData.id ? `/api/students/${formData.id}` : '/api/students';
        const method = formData.id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        if (res.ok) {
            fetchStudents();
            closeForm();
        } else {
            const data = await res.json();
            alert(`저장 실패: ${data.error || "알 수 없는 오류"}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("정말 삭제하시겠습니까?")) {
            await fetch(`/api/students/${id}`, { method: 'DELETE' });
            fetchStudents();
        }
    };

    const handleAddClass = async () => {
        const newClassName = prompt("새로운 수업 이름을 입력해주세요 (예: 심화반)");
        if (!newClassName) return;

        try {
            const res = await fetch('/api/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newClassName })
            });

            if (res.ok) {
                alert("수업이 추가되었습니다.");
                fetchClasses();
                setFormData(prev => ({ ...prev, className: newClassName }));
            } else if (res.status === 409) {
                alert("이미 존재하는 수업 이름입니다.");
                setFormData(prev => ({ ...prev, className: newClassName }));
            } else {
                alert("추가 실패");
            }
        } catch (e) { console.error(e); }
    };

    const openEdit = (student: Student) => {
        setFormData(student);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setFormData({ id: "", name: "", parentPhone: "", memo: "", passcode: "", className: "", tuition_due_day: 0 });
    };

    const handleResetPassword = async (student: Student) => {
        if (!confirm(`${student.name} 학생 학부모님의 비밀번호를 전화번호 뒷자리 4자리로 초기화하시겠습니까?`)) return;

        try {
            const res = await fetch(`/api/students/${student.id}/reset-password`, { method: 'POST' });
            if (res.ok) alert("비밀번호가 초기화되었습니다.");
            else alert("초기화 실패");
        } catch (e) {
            console.error(e);
            alert("오류 발생");
        }
    };

    const [editingCell, setEditingCell] = useState<{ id: string, field: keyof Student } | null>(null);
    const [tempValue, setTempValue] = useState<string>("");

    const startEditing = (student: Student, field: keyof Student) => {
        setEditingCell({ id: student.id, field });
        const val = student[field];
        setTempValue(val !== undefined && val !== null ? String(val) : "");
    };

    const saveEdit = async () => {
        if (!editingCell) return;
        await saveValue(editingCell.id, editingCell.field, tempValue);
        setEditingCell(null);
    };

    const saveValue = async (id: string, field: keyof Student, value: string) => {
        const student = students.find(s => s.id === id);
        if (!student) return;

        // Convert value back to number if field is tuition_due_day
        let finalValue: string | number = value;
        if (field === 'tuition_due_day') {
            finalValue = parseInt(value) || 0;
        }

        // Skip if value hasn't changed
        if (student[field] === finalValue) return;

        const updatedStudent = { ...student, [field]: finalValue };

        try {
            const res = await fetch(`/api/students/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedStudent)
            });

            if (res.ok) {
                setStudents(prev => prev.map(s => s.id === id ? updatedStudent : s));
            } else {
                console.error("Update failed");
                alert("수정 실패");
            }
        } catch (e) {
            console.error(e);
            alert("오류 발생");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') setEditingCell(null);
    };

    return (
        <div className="main">
            <header className="flex-center justify-between" style={{ marginBottom: "1.5rem" }}>
                <h1 className="heading-lg">학생 관리</h1>
                <div className="flex-center gap-sm">
                    <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>
                        <Plus size={20} />
                        <span>학생 추가</span>
                    </button>
                </div>
            </header>

            {/* Student List */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="sticky-col-class" style={{ backgroundColor: "#f3f4f6" }}>수업</th>
                            <th className="sticky-col-name" style={{ backgroundColor: "#f3f4f6" }}>이름</th>
                            <th style={{ minWidth: "100px" }}>연락처</th>
                            <th style={{ minWidth: "80px" }}>약정일</th>
                            <th style={{ minWidth: "100px" }}>출석코드</th>
                            <th style={{ width: "30%" }}>메모</th>
                            <th style={{ width: "120px", textAlign: "center" }}>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
                                    <div className="flex-col flex-center gap-sm">
                                        <p>등록된 학생이 없습니다.</p>
                                        <p className="text-sm">상단의 &apos;학생 추가&apos; 버튼을 눌러주세요.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            students.map(student => (
                                <tr key={student.id}>
                                    <td className="sticky-col-class" style={{ backgroundColor: "white" }} onClick={() => startEditing(student, 'className')}>
                                        {editingCell?.id === student.id && editingCell.field === 'className' ? (
                                            <select
                                                className="input text-sm p-1 w-full"
                                                value={tempValue}
                                                onChange={async (e) => {
                                                    const newVal = e.target.value;
                                                    setTempValue(newVal);
                                                    await saveValue(student.id, 'className', newVal);
                                                    setEditingCell(null);
                                                }}
                                                onKeyDown={handleKeyDown}
                                                onBlur={() => setEditingCell(null)}
                                                autoFocus
                                            >
                                                <option value="">선택</option>
                                                {classList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                            </select>
                                        ) : (
                                            <span className="text-xs text-sub cursor-pointer hover:bg-gray-100 p-1 rounded block" >
                                                {student.className || <span className="text-gray-300">클릭하여 선택</span>}
                                            </span>
                                        )}
                                    </td>
                                    <td className="sticky-col-name" style={{ backgroundColor: "white" }}>
                                        <span style={{ fontWeight: 600 }}>{student.name}</span>
                                    </td>
                                    <td><a href={`tel:${student.parentPhone}`}>{student.parentPhone}</a></td>
                                    <td onClick={() => startEditing(student, 'tuition_due_day')}>
                                        {editingCell?.id === student.id && editingCell.field === 'tuition_due_day' ? (
                                            <input
                                                type="number"
                                                className="input text-sm p-1 w-full text-center"
                                                value={tempValue}
                                                onChange={e => setTempValue(e.target.value)}
                                                onBlur={saveEdit}
                                                onKeyDown={handleKeyDown}
                                                autoFocus
                                                min={1} max={31}
                                            />
                                        ) : (
                                            <span className="text-sub cursor-pointer hover:bg-gray-100 p-1 rounded block text-center" >
                                                {student.tuition_due_day ? `${student.tuition_due_day}일` : <span className="text-gray-300">-</span>}
                                            </span>
                                        )}
                                    </td>
                                    <td onClick={() => startEditing(student, 'passcode')}>
                                        {editingCell?.id === student.id && editingCell.field === 'passcode' ? (
                                            <input
                                                type="text"
                                                className="input text-sm p-1 w-full text-center"
                                                value={tempValue}
                                                onChange={e => setTempValue(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                                                onBlur={saveEdit}
                                                onKeyDown={handleKeyDown}
                                                autoFocus
                                                maxLength={4}
                                            />
                                        ) : (
                                            <span className="text-primary cursor-pointer hover:bg-gray-100 p-1 rounded block text-center" style={{ fontFamily: "monospace", fontWeight: 600 }}>
                                                {student.passcode || <span className="text-gray-300">-</span>}
                                            </span>
                                        )}
                                    </td>
                                    <td onClick={() => startEditing(student, 'memo')}>
                                        {editingCell?.id === student.id && editingCell.field === 'memo' ? (
                                            <input
                                                type="text"
                                                className="input text-sm p-1 w-full"
                                                value={tempValue}
                                                onChange={e => setTempValue(e.target.value)}
                                                onBlur={saveEdit}
                                                onKeyDown={handleKeyDown}
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="text-muted text-sm cursor-pointer hover:bg-gray-100 p-1 rounded block" style={{ minHeight: '24px' }}>
                                                {student.memo || <span className="text-gray-300">클릭하여 입력</span>}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex-center gap-xs" style={{ justifyContent: "center" }}>
                                            <button className="btn" style={{ padding: "0.4rem", color: "var(--primary)", backgroundColor: "#eef2ff" }} onClick={() => handleResetPassword(student)} title="학부모 비밀번호 초기화">
                                                리셋
                                            </button>
                                            <button className="btn" style={{ padding: "0.4rem", color: "#ef4444", backgroundColor: "#fef2f2" }} onClick={() => handleDelete(student.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {isFormOpen && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
                }}>
                    <div className="card" style={{ width: "90%", maxWidth: "400px" }}>
                        <h2 className="heading-md" style={{ marginBottom: "1rem" }}>{formData.id ? "학생 수정" : "학생 등록"}</h2>
                        <form onSubmit={handleSubmit} className="flex-col gap-md">
                            <div>
                                <label className="text-sm text-sub block mb-1">수업 (Class)</label>
                                <div className="flex gap-2">
                                    <select
                                        className="input"
                                        style={{ flex: 1 }}
                                        value={formData.className || ""}
                                        onChange={e => setFormData({ ...formData, className: e.target.value })}
                                    >
                                        <option value="">선택해주세요</option>
                                        {classList.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                    <button type="button" onClick={handleAddClass} className="btn btn-secondary" style={{ padding: "0.5rem" }}>
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-sub block mb-1">이름</label>
                                <input type="text" required className="input" value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="홍길동" />
                            </div>
                            <div>
                                <label className="text-sm text-sub block mb-1">부모님 연락처</label>
                                <input type="tel" required className="input" value={formData.parentPhone}
                                    onChange={e => setFormData({ ...formData, parentPhone: e.target.value })} placeholder="010-1234-5678" />
                            </div>
                            <div>
                                <label className="text-sm text-sub block mb-1">출석체크 비밀번호 (4자리)</label>
                                <input type="text" required maxLength={4} className="input text-center text-lg tracking-widest"
                                    value={formData.passcode}
                                    onChange={e => setFormData({ ...formData, passcode: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })}
                                    placeholder="1234" />
                            </div>
                            <div>
                                <label className="text-sm text-sub block mb-1">메모</label>
                                <textarea className="input" style={{ resize: "none" }} rows={3} value={formData.memo}
                                    onChange={e => setFormData({ ...formData, memo: e.target.value })} />
                            </div>

                            <div>
                                <label className="text-sm text-sub block mb-1">학원비 납부 약정일 (매월)</label>
                                <div className="flex items-center gap-2">
                                    <input type="number" min={1} max={31} className="input w-24 text-center"
                                        value={formData.tuition_due_day || ""}
                                        onChange={e => setFormData({ ...formData, tuition_due_day: parseInt(e.target.value) || 0 })}
                                        placeholder="15" />
                                    <span className="text-sm text-sub">일</span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button type="button" onClick={closeForm} className="btn btn-secondary flex-1">취소</button>
                                <button type="submit" className="btn btn-primary flex-1">저장</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
