"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit } from "lucide-react";

type Student = {
    id: string;
    name: string;
    parentPhone: string;
    passcode: string; // New field for 4-digit code
    memo: string;
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

    // Load students from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("students");
        if (saved) {
            setStudents(JSON.parse(saved));
        }
    }, []);

    // Save students to localStorage whenever list changes
    useEffect(() => {
        localStorage.setItem("students", JSON.stringify(students));
    }, [students]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.id) {
            // Edit existing
            setStudents(students.map(s => s.id === formData.id ? formData : s));
        } else {
            // Add new
            const newStudent = { ...formData, id: Date.now().toString() };
            setStudents([...students, newStudent]);
        }

        closeForm();
    };

    const handleDelete = (id: string) => {
        if (confirm("정말 삭제하시겠습니까?")) {
            setStudents(students.filter(s => s.id !== id));
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

    const generateDummyData = () => {
        const lastNames = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"];
        const firstNames = ["민수", "지원", "서연", "도윤", "하은", "준호", "지우", "예준", "서현", "민재", "수진", "현우", "지민", "가은"];

        const dummies: Student[] = [];
        for (let i = 0; i < 20; i++) {
            const randomName = lastNames[Math.floor(Math.random() * lastNames.length)] + firstNames[Math.floor(Math.random() * firstNames.length)];
            dummies.push({
                id: Date.now().toString() + i,
                name: randomName,
                parentPhone: `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
                passcode: Math.floor(Math.random() * 9000 + 1000).toString(),
                memo: Math.random() > 0.7 ? "테스트 특이사항 메모입니다." : "",
            });
        }
        setStudents(prev => [...prev, ...dummies]);
        alert("임의의 학생 20명이 추가되었습니다.");
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

            {/* Student List */}
            <div className="flex-col gap-md">
                {students.length === 0 ? (
                    <div className="card flex-center" style={{ padding: "3rem", color: "var(--text-muted)" }}>
                        <p>등록된 학생이 없습니다.</p>
                    </div>
                ) : (
                    students.map(student => (
                        <div key={student.id} className="card" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}>
                            <div>
                                <h3 className="heading-md">{student.name}</h3>
                                <p className="text-sub text-sm">{student.parentPhone}</p>
                                <p className="text-xs text-primary">비밀번호: {student.passcode || "미설정"}</p>
                                {student.memo && <p className="text-muted text-xs">{student.memo}</p>}
                            </div>
                            <div className="flex-center gap-sm">
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: "0.5rem" }}
                                    onClick={() => openEdit(student)}
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    className="btn"
                                    style={{ padding: "0.5rem", color: "#ef4444" }}
                                    onClick={() => handleDelete(student.id)}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
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
