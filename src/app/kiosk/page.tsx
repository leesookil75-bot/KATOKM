"use client";

import { useState, useEffect } from "react";
import { MoveLeft, Eraser, Check } from "lucide-react";
import Link from 'next/link';

type KioskStep = "input" | "processing" | "success";

export default function KioskPage() {
    const [passcode, setPasscode] = useState("");
    const [step, setStep] = useState<KioskStep>("input");
    const [studentName, setStudentName] = useState("");
    const [message, setMessage] = useState("");

    const [academyName, setAcademyName] = useState("");

    useEffect(() => {
        async function fetchSession() {
            try {
                const res = await fetch('/api/auth/session');
                if (res.ok) {
                    const session = await res.json();
                    setAcademyName(session.user.academy_name || "학원");
                }
            } catch (e) {
                console.error(e);
            }
        }
        fetchSession();
    }, []);

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
        <div className="main flex-col" style={{ height: "100vh", backgroundColor: "black", color: "white" }}>
            {/* Header */}
            <header className="flex-center justify-between p-4">
                <Link href="/" className="text-gray-400"><MoveLeft size={32} /></Link>
                <h2 className="text-xl font-bold">{academyName}</h2>
                <div style={{ width: "32px" }}></div>
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

                        {/* Asterisk Display */}
                        <div className="flex-center gap-6 mb-12 h-12">
                            {[0, 1, 2, 3].map(i => (
                                <span key={i} className="text-5xl font-mono text-white opacity-80" style={{ width: '1ch', textAlign: 'center' }}>
                                    {i < passcode.length ? "*" : "_"}
                                </span>
                            ))}
                        </div>

                        {/* Keypad */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", maxWidth: "320px", width: "100%" }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button key={num} onClick={() => handleNumberClick(num)}
                                    className="flex-center"
                                    style={{
                                        aspectRatio: "1", borderRadius: "50%", backgroundColor: "#1f2937",
                                        fontSize: "2.5rem", fontWeight: "bold", color: "white"
                                    }}>
                                    {num}
                                </button>
                            ))}
                            <div />
                            <button onClick={() => handleNumberClick(0)}
                                className="flex-center"
                                style={{
                                    aspectRatio: "1", borderRadius: "50%", backgroundColor: "#1f2937",
                                    fontSize: "2.5rem", fontWeight: "bold", color: "white"
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
