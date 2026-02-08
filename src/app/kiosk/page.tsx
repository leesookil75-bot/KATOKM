"use client";

import { useState, useEffect } from "react";
import { MoveLeft, Eraser, Check } from "lucide-react";
import Link from 'next/link';

type Student = {
    id: string;
    name: string;
    parentPhone: string;
    passcode: string;
};

type AttendanceStatus = "출석" | "결석" | "지각" | "조퇴" | "미처리";

export default function KioskPage() {
    const [passcode, setPasscode] = useState("");
    const [students, setStudents] = useState<Student[]>([]);
    const [matchedStudent, setMatchedStudent] = useState<Student | null>(null);
    const [actionStep, setActionStep] = useState<"input" | "select" | "completed">("input");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const saved = localStorage.getItem("students");
        if (saved) {
            setStudents(JSON.parse(saved));
        }
    }, []);

    const handleNumberClick = (num: number) => {
        if (passcode.length < 4) {
            const newPasscode = passcode + num.toString();
            setPasscode(newPasscode);

            if (newPasscode.length === 4) {
                checkPasscode(newPasscode);
            }
        }
    };

    const handleClear = () => {
        setPasscode("");
        setMatchedStudent(null);
        setActionStep("input");
    };

    const handleBackspace = () => {
        setPasscode(prev => prev.slice(0, -1));
    };

    const checkPasscode = (code: string) => {
        const student = students.find(s => s.passcode === code);
        if (student) {
            setMatchedStudent(student);
            setActionStep("select");
        } else {
            alert("등록되지 않은 번호입니다. 다시 확인해주세요.");
            setPasscode("");
        }
    };

    const handleAttendance = (type: "in" | "out") => {
        if (!matchedStudent) return;

        // 1. Update Attendance
        const today = new Date().toISOString().split('T')[0];
        const savedAttendance = localStorage.getItem(`attendance-${today}`);
        let attendanceData = savedAttendance ? JSON.parse(savedAttendance) : {};

        const status = type === "in" ? "출석" : "조퇴"; // Or "House" logic if we had check-out time
        attendanceData[matchedStudent.id] = status;
        localStorage.setItem(`attendance-${today}`, JSON.stringify(attendanceData));

        // 2. Prepare Message
        const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        let msg = "";
        if (type === "in") {
            msg = `[출결알림] ${matchedStudent.name} 학생이 ${time}에 등원하였습니다.`;
        } else {
            msg = `[출결알림] ${matchedStudent.name} 학생이 ${time}에 하원하였습니다.`;
        }

        setMessage(msg);
        setActionStep("completed");

        // Auto reset after 10 seconds if no action
        setTimeout(() => {
            if (actionStep === "completed") {
                handleClear();
            }
        }, 10000);
    };

    const sendKakao = () => {
        // Attempt Kakao Link - This works if KakaoTalk is installed
        // Without Javascript SDK, we use the custom scheme
        // To send to a *specific* person (parent), we rely on the user picking the chat.
        // Ideally we'd use 'sms:' scheme for reliability on mobile without SDK
        if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
            window.location.href = `sms:${matchedStudent?.parentPhone}${navigator.userAgent.match(/iPhone/) ? '&' : '?'}body=${encodeURIComponent(message)}`;
        } else {
            // Desktop
            navigator.clipboard.writeText(message);
            alert("메시지가 복사되었습니다. 카카오톡을 열어 붙여넣기 해주세요.");
            // window.location.href = "kakaotalk://";
        }
    };

    const finish = () => {
        handleClear();
    };

    if (actionStep === "completed") {
        return (
            <div className="main flex-center flex-col" style={{ backgroundColor: "#f0fdf4", height: "100vh", textAlign: "center", padding: "2rem" }}>
                <div className="bg-green-100 p-6 rounded-full mb-6">
                    <Check size={64} className="text-green-600" />
                </div>
                <h1 className="heading-xl mb-4">{matchedStudent?.name} 학생</h1>
                <p className="heading-md text-sub mb-8">{message}</p>

                <div className="flex-col gap-md w-full max-w-sm">
                    <button
                        onClick={sendKakao}
                        className="btn w-full py-4 text-lg font-bold"
                        style={{ backgroundColor: "#FAE100", color: "#3C1E1E" }}
                    >
                        보호자에게 문자/카톡 보내기
                    </button>
                    <button
                        onClick={finish}
                        className="btn btn-secondary w-full py-4 text-lg"
                    >
                        처음으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="main flex-col" style={{ height: "100vh", backgroundColor: "#111827", color: "white" }}>
            {/* Header */}
            <header className="flex-center justify-between p-4">
                <Link href="/" className="text-gray-400"><MoveLeft /></Link>
                <span className="text-gray-400 text-sm">출결 키오스크</span>
                <div style={{ width: "24px" }}></div>
            </header>

            {/* Display */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", paddingBottom: "2rem" }}>

                {actionStep === "select" ? (
                    <div className="flex-col gap-xl w-full max-w-sm animate-pulse-once">
                        <h2 className="heading-xl text-center mb-8">
                            <span className="text-indigo-400">{matchedStudent?.name}</span> 학생,<br />반갑습니다!
                        </h2>
                        <button
                            onClick={() => handleAttendance("in")}
                            className="btn w-full py-6 text-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg"
                        >
                            등원 (Check-in)
                        </button>
                        <button
                            onClick={() => handleAttendance("out")}
                            className="btn w-full py-6 text-xl font-bold bg-gray-700 hover:bg-gray-600 text-white rounded-xl shadow-lg"
                        >
                            하원 (Check-out)
                        </button>

                        <button onClick={handleClear} className="mt-4 text-gray-400 underline text-center">
                            취소하고 다시 입력하기
                        </button>
                    </div>
                ) : (
                    <>
                        <h1 className="heading-lg mb-8 text-center text-gray-300">출석번호 4자리를<br />눌러주세요</h1>

                        {/* Dots */}
                        <div className="flex-center gap-4 mb-12">
                            {[0, 1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    style={{
                                        width: "20px",
                                        height: "20px",
                                        borderRadius: "50%",
                                        backgroundColor: i < passcode.length ? "#6366f1" : "#374151",
                                        transition: "all 0.2s"
                                    }}
                                />
                            ))}
                        </div>

                        {/* Numpad */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", width: "100%", maxWidth: "320px" }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button
                                    key={num}
                                    onClick={() => handleNumberClick(num)}
                                    style={{
                                        aspectRatio: "1",
                                        borderRadius: "50%",
                                        backgroundColor: "#1f2937",
                                        color: "white",
                                        fontSize: "1.5rem",
                                        fontWeight: "bold",
                                        border: "none",
                                        cursor: "pointer",
                                        transition: "background-color 0.1s"
                                    }}
                                    className="active:bg-indigo-600"
                                >
                                    {num}
                                </button>
                            ))}

                            <div /> {/* Empty */}

                            <button
                                onClick={() => handleNumberClick(0)}
                                style={{
                                    aspectRatio: "1",
                                    borderRadius: "50%",
                                    backgroundColor: "#1f2937",
                                    color: "white",
                                    fontSize: "1.5rem",
                                    fontWeight: "bold",
                                    border: "none",
                                    cursor: "pointer"
                                }}
                            >
                                0
                            </button>

                            <button
                                onClick={handleBackspace}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    aspectRatio: "1",
                                    borderRadius: "50%",
                                    backgroundColor: "transparent",
                                    color: "#9ca3af",
                                    border: "none",
                                    cursor: "pointer"
                                }}
                            >
                                <Eraser size={24} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
