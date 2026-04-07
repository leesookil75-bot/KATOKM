"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    CheckCircle2,
    XCircle,
    Clock,
    CalendarDays,
    Info,
    Circle,
    Triangle,
    X
} from "lucide-react";
import Link from "next/link";

export default function parentAttendancePage() {
    const [attendance, setAttendance] = useState<any[]>([]);
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/attendance");
                if (res.ok) {
                    setAttendance(await res.json());
                } else if (res.status === 401) {
                    router.push("/login");
                }

                // Fetch session for academy name
                const sessionRes = await fetch("/api/auth/session");
                if (sessionRes.ok) {
                    setSession(await sessionRes.json());
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [router]);

    // Non-blocking loading

    return (
        <div className={`history-container ${session?.user?.academy_name ? 'has-banner' : ''}`}>
            {session?.user?.academy_name && (
                <div className="academy-banner">
                    {session.user.academy_name}
                </div>
            )}
            <header className="history-header">
                <Link href="/parent" className="back-btn">
                    <ChevronLeft size={24} />
                </Link>
                <h1>출석 이력</h1>
                <div style={{ width: 24 }}></div>
            </header>

            <main className="history-content">
                <div className="summary-banner">
                    <div className="banner-item">
                        <span className="label">이번 달 출석</span>
                        <span className="value">{attendance.filter(a => a.status === '출석').length}회</span>
                    </div>
                    <div className="banner-divider"></div>
                    <div className="banner-item">
                        <span className="label">전체 기록</span>
                        <span className="value">{attendance.length}건</span>
                    </div>
                </div>

                <div className="history-list">
                    {loading ? (
                        [1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="history-item skeleton-item shimmer">
                                <div className="skeleton-date"></div>
                                <div className="skeleton-info">
                                    <div className="skeleton-line"></div>
                                    <div className="skeleton-line short"></div>
                                </div>
                            </div>
                        ))
                    ) : attendance.length > 0 ? (
                        attendance.map((item, idx) => (
                            <div key={idx} className="history-item">
                                <div className="date-box">
                                    <span className="month">{new Date(item.date).getMonth() + 1}월</span>
                                    <span className="day">{new Date(item.date).getDate()}일</span>
                                </div>
                                <div className="info-box">
                                    <div className="status-row">
                                        <span className={`status-badge ${item.status === '출석' ? 'present' :
                                            item.status === '특이사항' ? 'special' : 'absent'
                                            }`}>
                                            {item.status === '출석' ? '출석' :
                                                item.status === '특이사항' ? '특이사항' : '결석'}
                                        </span>
                                        <div className="time-info">
                                            <Clock size={14} />
                                            <span>{new Date(item.created_at || item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                    {item.memo && (
                                        <div className="memo-row">
                                            <Info size={14} />
                                            <p>{item.memo}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <CalendarDays size={48} />
                            <p>기록된 출석 이력이 없습니다.</p>
                        </div>
                    )}
                </div>
            </main>

            <style jsx>{`
                .history-container {
                    min-height: 100vh;
                    background: #f8fafc;
                    padding-bottom: 2rem;
                }
                .academy-banner {
                    background: linear-gradient(90deg, #4f46e5, #6366f1);
                    color: white;
                    text-align: center;
                    padding: 0.5rem;
                    font-size: 0.85rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    position: sticky;
                    top: 0;
                    z-index: 20;
                }
                .has-banner .history-header {
                    top: 2.15rem;
                }
                .loading {
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #64748b;
                }
                .history-header {
                    background: white;
                    padding: 1.25rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .history-header h1 {
                    font-size: 1.15rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                }
                .back-btn { color: #64748b; }
                
                .history-content {
                    padding: 1rem;
                    max-width: 600px;
                    margin: 0 auto;
                }
                .summary-banner {
                    background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
                    border-radius: 1.25rem;
                    padding: 1.5rem;
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                    color: white;
                    margin-bottom: 1.5rem;
                    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.2);
                }
                .banner-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                }
                .banner-item .label { font-size: 0.85rem; opacity: 0.9; }
                .banner-item .value { font-size: 1.5rem; font-weight: 800; }
                .banner-divider { width: 1px; height: 30px; background: rgba(255,255,255,0.3); }

                .history-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .history-item {
                    background: white;
                    border-radius: 1rem;
                    padding: 1rem;
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .date-box {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-width: 56px;
                    height: 56px;
                    background: #f1f5f9;
                    border-radius: 0.75rem;
                    color: #475569;
                }
                .date-box .month { font-size: 0.75rem; font-weight: 600; }
                .date-box .day { font-size: 1.1rem; font-weight: 800; }

                .info-box { flex: 1; display: flex; flex-direction: column; gap: 0.4rem; }
                .status-row { display: flex; align-items: center; justify-content: space-between; }
                .status-badge {
                    font-size: 0.85rem;
                    font-weight: 700;
                    padding: 0.2rem 0.6rem;
                    border-radius: 0.5rem;
                }
                .status-badge.present { background: #eff6ff; color: #2563eb; }
                .status-badge.special { background: #f0fdf4; color: #16a34a; }
                .status-badge.absent { background: #fef2f2; color: #dc2626; }
                
                .time-info { display: flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; color: #94a3b8; }
                .memo-row { display: flex; align-items: flex-start; gap: 0.25rem; border-top: 1px dashed #f1f5f9; padding-top: 0.4rem; }
                .memo-row p { font-size: 0.8rem; color: #64748b; margin: 0; }
                
                .shimmer {
                    background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }
                @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                
                .skeleton-item { border: none; box-shadow: none; background: transparent !important; }
                .skeleton-date { width: 56px; height: 56px; background: #f1f5f9; border-radius: 0.75rem; }
                .skeleton-info { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
                .skeleton-line { height: 1rem; background: #f1f5f9; border-radius: 0.25rem; width: 100%; }
                .skeleton-line.short { width: 40%; }

                .empty-state { text-align: center; padding: 4rem 1rem; color: #94a3b8; }
                .empty-state p { margin-top: 1rem; }
            `}</style>
        </div>
    );
}
