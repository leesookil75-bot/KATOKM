"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit } from "lucide-react";

type Student = {
    id: string;
    name: string;
    parentPhone: string;
    passcode: string; // New field for 4-digit code
    memo: string;
    className?: string; // New field
};

export default function StudentManager() {
    const [students, setStudents] = useState<Student[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState<Student>({
        id: "",
        name: "",
        parentPhone: "",
        passcode: "",
        memo: "",
    });

    // Fetch students from API
    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/students');
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (error) {
            console.error("Failed to fetch students", error);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.id) {
            // Edit existing (PUT)
            const res = await fetch(`/api/students/${formData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) fetchStudents();
        } else {
            // Add new (POST)
            const res = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) fetchStudents();
        }

        closeForm();
    };

    const handleDelete = async (id: string) => {
        if (confirm("정말 삭제하시겠습니까?")) {
            await fetch(`/api/students/${id}`, { method: 'DELETE' });
            fetchStudents();
        }
    };

    const openEdit = (student: Student) => {
        setFormData(student);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setFormData({ id: "", name: "", parentPhone: "", memo: "", passcode: "" });
    };

    const generateDummyData = async () => {
        if (!confirm("연습용 학생 20명을 추가하시겠습니까?")) return;

        try {
            const res = await fetch('/api/seed?mode=dummy');
            if (res.ok) {
                alert("연습용 데이터가 생성되었습니다.");
                fetchStudents();
            } else {
                alert("데이터 생성 실패");
            }
        } catch (e) {
            console.error(e);
            alert("오류가 발생했습니다.");
        }
    };

    return (
        <div className="main">
            <header className="flex-center justify-between" style={{ marginBottom: "1.5rem" }}>
                <h1 className="heading-lg">학생 관리</h1>
                <div className="flex-center gap-sm">
                    <button
                        className="btn btn-secondary"
                        onClick={generateDummyData}
                        style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem" }}
                    >
                        + 20명 자동생성
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => setIsFormOpen(true)}
                    >
                        <Plus size={20} />
                        <span>학생 추가</span>
                    </button>
                </div>
            </header>

            {/* Student List (Table View) */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ minWidth: "100px" }}>수업</th>
                            <th style={{ minWidth: "80px" }}>이름</th>
                            <th style={{ minWidth: "120px" }}>연락처</th>
                            <th style={{ minWidth: "80px" }}>비밀번호</th>
                            <th style={{ width: "40%" }}>메모</th>
                            <th style={{ width: "100px", textAlign: "center" }}>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
                                    <div className="flex-col flex-center gap-sm">
                                        <p>등록된 학생이 없습니다.</p>
                                        <p className="text-sm">상단의 '학생 추가' 버튼을 눌러주세요.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            students.map(student => (
                                <tr key={student.id}>
                                    <td>
                                        <span className="text-xs text-sub" style={{ padding: "2px 6px", backgroundColor: "#f3f4f6", borderRadius: "4px" }}>
                                            {student.className || "-"}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{student.name}</span>
                                    </td>
                                    <td>
                                        <a href={`tel:${student.parentPhone}`} style={{ color: "var(--text-sub)" }}>
                                            {student.parentPhone}
                                        </a>
                                    </td>
                                    <td>
                                        <span className="text-primary" style={{ fontFamily: "monospace", fontWeight: 600, letterSpacing: "0.1em" }}>
                                            {student.passcode || "-"}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="text-muted text-sm" style={{ display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "200px" }}>
                                            {student.memo}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex-center gap-xs" style={{ justifyContent: "center" }}>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: "0.4rem", height: "32px", width: "32px" }}
                                                onClick={() => openEdit(student)}
                                                title="수정"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="btn"
                                                style={{ padding: "0.4rem", color: "#ef4444", height: "32px", width: "32px", border: "1px solid #fee2e2", backgroundColor: "#fef2f2" }}
                                                onClick={() => handleDelete(student.id)}
                                                title="삭제"
                                            >
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
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 50,
                }}>
                    <div className="card" style={{ width: "90%", maxWidth: "400px" }}>
                        <h2 className="heading-md" style={{ marginBottom: "1rem" }}>
                            {formData.id ? "학생 수정" : "학생 등록"}
                        </h2>
                        <form onSubmit={handleSubmit} className="flex-col gap-md">
                            <div>
                                <label className="text-sm text-sub" style={{ display: "block", marginBottom: "0.25rem" }}>수업 (Class)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.className || ""}
                                    onChange={e => setFormData({ ...formData, className: e.target.value })}
                                    placeholder="예: 월수금반, 초등A반"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-sub" style={{ display: "block", marginBottom: "0.25rem" }}>이름</label>
                                <input
                                    type="text"
                                    required
                                    className="input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="홍길동"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-sub" style={{ display: "block", marginBottom: "0.25rem" }}>부모님 연락처</label>
                                <input
                                    type="tel"
                                    required
                                    className="input"
                                    value={formData.parentPhone}
                                    onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                                    placeholder="010-1234-5678"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-sub" style={{ display: "block", marginBottom: "0.25rem" }}>출석체크 비밀번호 (4자리)</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={4}
                                    pattern="\d{4}"
                                    className="input"
                                    value={formData.passcode}
                                    onChange={e => setFormData({ ...formData, passcode: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })}
                                    placeholder="1234"
                                    style={{ letterSpacing: "0.2em", textAlign: "center", fontSize: "1.2rem" }}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-sub" style={{ display: "block", marginBottom: "0.25rem" }}>메모 (선택)</label>
                                <textarea
                                    className="input"
                                    style={{ minHeight: "80px", resize: "none" }}
                                    value={formData.memo}
                                    onChange={e => setFormData({ ...formData, memo: e.target.value })}
                                    placeholder="특이사항 등"
                                />
                            </div>
                            <div className="flex-center gap-sm" style={{ marginTop: "1rem" }}>
                                <button type="button" onClick={closeForm} className="btn btn-secondary" style={{ flex: 1 }}>취소</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>저장</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
