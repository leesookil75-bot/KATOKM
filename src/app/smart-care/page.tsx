"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, AlertCircle, Phone, MessageCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RiskStudent {
    id: string; // The backend query selected id without casting to string or number, but UUIDs are strings
    name: string;
    class_name: string;
    score: number;
    riskLevel: 'Red' | 'Yellow' | 'Green';
    reasons: string[];
    parentPhone?: string; // Need to fetch parentPhone too, we should modify the API or just fetch students here.
}

export default function SmartCareCenter() {
    const [students, setStudents] = useState<RiskStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<RiskStudent | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Here we fetch from /api/students and /api/admin/analytics/risk to merge them,
        // or we just modify the risk API to return parentPhone. 
        // For rapid implementation without changing the analytics backend again, we'll fetch both.
        const fetchData = async () => {
            try {
                const [resRisk, resStudents] = await Promise.all([
                    fetch('/api/admin/analytics/risk'),
                    fetch('/api/students')
                ]);
                if (resRisk.ok && resStudents.ok) {
                    const riskData: RiskStudent[] = await resRisk.json();
                    const allStudents: { id: string, parentPhone: string, memo: string }[] = await resStudents.json();
                    
                    // Merge parentPhone & memo
                    const merged = riskData.map(risk => {
                        const s = allStudents.find(stu => stu.id == risk.id);
                        return {
                            ...risk,
                            parentPhone: s?.parentPhone,
                            memo: s?.memo
                        };
                    });
                    
                    setStudents(merged);
                }
            } catch (err) {
                console.error("Failed to fetch smart care data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleResolve = async (id: string) => {
        if (!confirm("해당 학생의 상태를 '케어 완료(안전)' 상태로 변경하시겠습니까?\n리스트에서 즉시 제외됩니다.")) return;
        
        try {
            const res = await fetch(`/api/admin/analytics/risk/${id}/resolve`, { method: 'POST' });
            if (res.ok) {
                setStudents(prev => prev.filter(s => s.id !== id));
                setSelectedStudent(null);
                alert("케어가 완료되어 리스트에서 제외되었습니다!");
            } else {
                alert("처리 중 요류가 발생했습니다.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <div className="main flex-center" style={{ height: "100vh" }}>
                <span>분석 중...</span>
            </div>
        );
    }

    return (
        <div className="main flex-col gap-md" style={{ height: "auto", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            <header className="flex-center justify-between p-4 border-b bg-white z-10 sticky top-0">
                <Link href="/" className="btn text-sm">← 홈</Link>
                <h1 className="heading-md">스마트 케어 센터</h1>
                <div style={{ width: "40px" }}></div>
            </header>

            <div className="p-4 flex-col gap-4 max-w-3xl mx-auto w-full">
                <div className="card text-center" style={{ backgroundColor: "#1e293b", color: "white" }}>
                    <h2 className="heading-sm mb-2">집중 관리 프로세스</h2>
                    <p className="text-sm opacity-80 mb-4">
                        AI가 감지한 최우선 케어 대상입니다. 즉각적인 조치가 퇴원율을 낮춥니다.
                    </p>
                    <div className="flex-center gap-2 text-xs" style={{ justifyContent: "center" }}>
                        <span className="bg-red-500 text-white px-2 py-1 rounded">🚨 매우 위험 (Red)</span>
                        <span className="bg-yellow-500 text-white px-2 py-1 rounded">⚠️ 주의 (Yellow)</span>
                    </div>
                </div>

                {students.length === 0 ? (
                    <div className="card text-center py-10" style={{ backgroundColor: "white" }}>
                        <span className="text-4xl mb-4 block">🎉</span>
                        <h3 className="heading-sm">현재 위험 대상이 없습니다!</h3>
                        <p className="text-sub text-sm">모든 원생이 평온하게 잘 다니고 있습니다.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {students.map(student => (
                            <div 
                                key={student.id} 
                                className="card flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow relative"
                                style={{ borderLeft: `4px solid ${student.riskLevel === 'Red' ? '#ef4444' : '#eab308'}` }}
                                onClick={() => setSelectedStudent(student)}
                            >
                                <div className="flex-center justify-between">
                                    <div className="flex-center gap-2">
                                        {student.riskLevel === 'Red' ? <AlertTriangle size={18} color="#ef4444" /> : <AlertCircle size={18} color="#eab308" />}
                                        <h3 className="font-bold text-lg">{student.name} <span className="text-sm font-normal text-sub ml-1">{student.class_name || '반 미지정'}</span></h3>
                                    </div>
                                    <span className="font-bold text-sm" style={{ color: student.riskLevel === 'Red' ? '#ef4444' : '#eab308' }}>
                                        {student.score}점
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {student.reasons.map((r, idx) => (
                                        <span key={idx} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                                            {r}
                                        </span>
                                    ))}
                                </div>
                                <div className="absolute right-4 top-1/2" style={{ transform: "translateY(-50%)", opacity: 0.3 }}>
                                    <span>👉 터치</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Intuitive Modal for Care Actions */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/60 flex-center z-50 p-4" onClick={() => setSelectedStudent(null)}>
                    <div className="card w-full max-w-md bg-white flex-col gap-4 shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="flex-center justify-between border-b pb-3">
                            <h2 className="heading-md">학생 프로필 상세</h2>
                            <button onClick={() => setSelectedStudent(null)} className="text-2xl text-gray-400 hover:text-black">×</button>
                        </div>

                        <div className="flex-col gap-1 text-center py-4 bg-gray-50 rounded-lg">
                            <span className="text-3xl mb-2">👤</span>
                            <h3 className="heading-lg text-indigo-900">{selectedStudent.name}</h3>
                            <span className="text-sub font-medium">{selectedStudent.class_name || '소속 반 없음'}</span>
                            <span className="text-xs text-red-500 mt-2 font-bold bg-white px-3 py-1 rounded-full border border-red-100 inline-block mx-auto">
                                위기 단계: {selectedStudent.riskLevel} ({selectedStudent.score}점)
                            </span>
                        </div>

                        <div className="flex-col gap-2">
                            <strong className="text-sm text-gray-700 mt-2">🚨 위험 감지 사유:</strong>
                            <ul className="text-sm text-gray-600 bg-red-50 p-3 rounded list-disc pl-5">
                                {selectedStudent.reasons.map((r, i) => <li key={i} className="mb-1">{r}</li>)}
                            </ul>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <a 
                                href={selectedStudent.parentPhone ? `tel:${selectedStudent.parentPhone}` : '#'}
                                className="btn flex-center gap-2 py-3 shadow-sm border border-indigo-100"
                                style={{ backgroundColor: '#eef2ff', color: '#4338ca' }}
                                onClick={(e) => { if(!selectedStudent.parentPhone) { e.preventDefault(); alert("등록된 전화번호가 없습니다."); } }}
                            >
                                <Phone size={18} /> 전화 상담
                            </a>
                            <button 
                                className="btn flex-center gap-2 py-3 shadow-sm border border-emerald-100"
                                style={{ backgroundColor: '#ecfdf5', color: '#047857' }}
                                onClick={() => router.push(`/message?studentId=${selectedStudent.id}`)}
                            >
                                <MessageCircle size={18} /> 알림톡 보내기
                            </button>
                        </div>

                        <button 
                            className="btn btn-primary mt-2 py-4 shadow-md bg-indigo-600 hover:bg-indigo-700 transition-colors"
                            onClick={() => handleResolve(selectedStudent.id)}
                            style={{ width: "100%", fontSize: "1rem" }}
                        >
                            <CheckCircle size={20} className="mr-2" /> 조치 완료 (위험 리스트에서 제거)
                        </button>

                    </div>
                </div>
            )}
        </div>
    );
}
