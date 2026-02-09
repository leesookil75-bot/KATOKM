"use client";

import { useState } from "react";
import { MoveLeft, Eraser, Check } from "lucide-react";
import Link from 'next/link';

type KioskStep = "input" | "processing" | "success";

export default function KioskPage() {
    const [passcode, setPasscode] = useState("");
    const [step, setStep] = useState<KioskStep>("input");
    const [studentName, setStudentName] = useState("");
    const [message, setMessage] = useState("");

    const handleNumberClick = (num: number) => {
        if (passcode.length < 4) {
            const newCode = passcode + num.toString();
            setPasscode(newCode);
            if (newCode.length === 4) {
                submitCheckIn(newCode);
            }
        }
    };

    const handleBackspace = () => setPasscode(prev => prev.slice(0, -1));
    const handleClear = () => setPasscode("");

    const submitCheckIn = async (code: string) => {
        setStep("processing");
        try {
            const res = await fetch('/api/kiosk/check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode: code })
            });

            if (res.ok) {
                const data = await res.json();
                setStudentName(data.student.name);
                setMessage(`${data.student.name} 학생 출석이 완료되었습니다.\n(학부모님께 문자가 전송되었습니다)`);
                setStep("success");

                // Auto reset after 3 seconds
                setTimeout(() => {
                    setStep("input");
                    setPasscode("");
                }, 3000);
            } else {
                alert("등록되지 않은 출석번호입니다.");
                setStep("input");
                setPasscode("");
            }
        } catch (e) {
            console.error(e);
            alert("오류가 발생했습니다.");
            setStep("input");
            setPasscode("");
        }
    };

    return (
        <div className="main flex-col" style={{ height: "100vh", backgroundColor: "#111827", color: "white" }}>
            {/* Header */}
            <header className="flex-center justify-between p-4">
                <Link href="/" className="text-gray-400"><MoveLeft /></Link>
                <span className="text-gray-400 text-sm">키오스크 모드</span>
                <div style={{ width: "24px" }}></div>
            </header>

            {/* Content */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", paddingBottom: "4rem" }}>

                {step === "success" ? (
                    <div className="flex-col flex-center animate-pulse">
                        <div className="bg-green-500 rounded-full p-6 mb-6">
                            <Check size={64} color="white" />
                        </div>
                        <h1 className="heading-xl mb-4">{studentName}</h1>
                        <p className="text-gray-300 text-center whitespace-pre-line">{message}</p>
                    </div>
                ) : (
                    <>
                        <h1 className="heading-xl mb-8 text-center text-gray-200">
                            출석번호를 입력해주세요
                        </h1>

                        {/* Dots */}
                        <div className="flex-center gap-4 mb-12">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} style={{
                                    width: "20px", height: "20px", borderRadius: "50%",
                                    backgroundColor: i < passcode.length ? "#6366f1" : "#374151",
                                    transition: "all 0.2s"
                                }} />
                            ))}
                        </div>

                        {/* Keypad */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", maxWidth: "320px", width: "100%" }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button key={num} onClick={() => handleNumberClick(num)}
                                    className="flex-center"
                                    style={{
                                        aspectRatio: "1", borderRadius: "50%", backgroundColor: "#1f2937",
                                        fontSize: "1.8rem", fontWeight: "bold", color: "white"
                                    }}>
                                    {num}
                                </button>
                            ))}
                            <div />
                            <button onClick={() => handleNumberClick(0)}
                                className="flex-center"
                                style={{
                                    aspectRatio: "1", borderRadius: "50%", backgroundColor: "#1f2937",
                                    fontSize: "1.8rem", fontWeight: "bold", color: "white"
                                }}>
                                0
                            </button>
                            <button onClick={handleBackspace}
                                className="flex-center"
                                style={{ aspectRatio: "1", color: "#9ca3af" }}>
                                <Eraser size={32} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
