"use client";

import { useState, useEffect } from "react";
import { Send, Copy } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Student = {
    id: string;
    name: string;
    parentPhone: string;
};

type AttendanceStatus = "출석" | "결석" | "지각" | "조퇴" | "미처리";

export default function MessagePage() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<{ [key: string]: AttendanceStatus }>({});
    const [date, setDate] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [messageTemplate, setMessageTemplate] = useState("");

    // Load data
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setDate(today);

        const savedStudents = localStorage.getItem("students");
        const savedAttendance = localStorage.getItem(`attendance-${today}`);

        if (savedStudents) {
            setStudents(JSON.parse(savedStudents));
        }

        if (savedAttendance) {
            setAttendance(JSON.parse(savedAttendance));
        }
    }, []);

    // Update Message Template when selection changes
    useEffect(() => {
        if (!selectedStudentId) {
            setMessageTemplate("");
            return;
        }

        const student = students.find(s => s.id === selectedStudentId);
        if (!student) return;

        const status = attendance[selectedStudentId] || "미처리";

        let text = `[출결 알림]\n\n`;
        text += `안녕하세요, ${student.name} 학부모님.\n`;
        text += `${date} ${student.name} 학생의 출결 현황 안내드립니다.\n\n`;

        const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

        switch (status) {
            case "출석":
                text += `✅ 등원 완료 (${time})\n`;
                text += `오늘도 즐겁게 공부하고 안전하게 귀가하도록 지도하겠습니다.`;
                break;
            case "지각":
                text += `⚠️ 지각 (${time})\n`;
                text += `학생이 조금 늦게 등원하였습니다.`;
                break;
            case "조퇴":
                text += `🏃 조퇴 (${time})\n`;
                text += `사정이 있어 일찍 귀가하였습니다.`;
                break;
            case "결석":
                text += `❌ 결석\n`;
                text += `금일 결석 처리되었습니다.`;
                break;
            default:
                text += `❓ 미처리\n`;
                text += `아직 출석 체크가 완료되지 않았습니다.`;
        }

        setMessageTemplate(text);

    }, [selectedStudentId, attendance, students, date]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(messageTemplate);
            alert("메시지가 클립보드에 복사되었습니다.");
        } catch (err) {
            console.error('Failed to copy: ', err);
            alert("복사에 실패했습니다.");
        }
    };

    const handleShare = async () => {
        if (!messageTemplate) return;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: '출결 알림',
                    text: messageTemplate,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback: Copy and try to open KakaoTalk
            handleCopy();
            // window.location.href = `kakaotalk://`; // This might not work reliably without SDK
            // opening specific chat directly isn't possible via URL scheme without user interaction history or SDK
            alert("PC에서는 '복사' 후 카카오톡 PC버전에 붙여넣기 해주세요.");
        }
    };

    return (
        <div className="main flex-col gap-md" style={{ height: "100vh", overflow: "hidden" }}>
            <header className="flex-center justify-between p-4 border-b">
                <Link href="/" className="btn text-sm">← 홈으로</Link>
                <h1 className="heading-md">알림 전송</h1>
                <div style={{ width: "80px" }}></div>
            </header>

            <div className="flex-row gap-md" style={{ flex: 1, padding: "1rem", overflow: "hidden" }}>
                {/* Left: Student List */}
                <div className="card flex-col gap-sm" style={{ width: "35%", overflowY: "auto", padding: "0.5rem" }}>
                    <h3 className="heading-sm text-center mb-2">학생 목록</h3>
                    {students.map(student => (
                        <button
                            key={student.id}
                            onClick={() => setSelectedStudentId(student.id)}
                            className={`btn w-full justify-between text-sm p-2 rounded ${selectedStudentId === student.id
                                    ? "bg-indigo-100 text-indigo-700 font-bold"
                                    : "hover:bg-gray-50"
                                }`}
                            style={{
                                textAlign: "left",
                                backgroundColor: selectedStudentId === student.id ? "var(--primary-light)" : "transparent",
                                color: selectedStudentId === student.id ? "white" : "inherit"
                            }}
                        >
                            <span>{student.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${attendance[student.id] === '출석' ? 'bg-green-100 text-green-700' :
                                    attendance[student.id] === '결석' ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                                }`}
                                style={{
                                    color: "inherit", opacity: 0.8
                                }}>
                                {attendance[student.id] || "-"}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Right: Message Preview & Actions */}
                <div className="card flex-col gap-md" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <h3 className="heading-sm text-center">메시지 미리보기</h3>
                    <textarea
                        className="input flex-1 p-4 resize-none text-sm leading-relaxed"
                        style={{ flex: 1, fontFamily: "inherit" }}
                        value={messageTemplate}
                        onChange={(e) => setMessageTemplate(e.target.value)}
                        placeholder="좌측 목록에서 학생을 선택해주세요."
                    />

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                        <button
                            onClick={handleCopy}
                            disabled={!selectedStudentId}
                            className="btn btn-secondary flex-center gap-2 py-3"
                        >
                            <Copy size={18} />
                            복사하기
                        </button>
                        <button
                            onClick={handleShare}
                            disabled={!selectedStudentId}
                            className="btn flex-center gap-2 py-3 font-bold"
                            style={{ backgroundColor: "#FAE100", color: "#3C1E1E" }}
                        >
                            <Send size={18} />
                            카톡 전송
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
