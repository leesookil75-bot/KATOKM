"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    CreditCard,
    CheckCircle2,
    Clock,
    Calendar,
    AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function parentTuitionPage() {
    const [tuitionData, setTuitionData] = useState<any>(null);
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(`/api/tuition?year=${new Date().getFullYear()}`);
                if (res.ok) {
                    setTuitionData(await res.json());
                } else if (res.status === 401) {
                    router.push("/parent/login");
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

    const currentMonth = new Date().getMonth() + 1;
    const unpaidCount = tuitionData?.records?.filter((r: any) => r.status === 'unpaid').length || 0;

    return (
        <div className="history-container">
            {session?.user?.academy_name && (
                <div className="academy-banner">
                    {session.user.academy_name}
                </div>
            )}
            <header className="history-header">
                <Link href="/parent" className="back-btn">
                    <ChevronLeft size={24} />
                </Link>
                <h1>수강료 이력</h1>
                <div style={{ width: 24 }}></div>
            </header>

            <main className="history-content">
                <div className="summary-banner">
                    <div className="banner-item">
                        <span className="label">미납 현황</span>
                        <span className="value" style={{ color: unpaidCount > 0 ? '#fca5a5' : 'white' }}>
                            {unpaidCount}건
                        </span>
                    </div>
                    <div className="banner-divider"></div>
                    <div className="banner-item">
                        <span className="label">납부 약정일</span>
                        <span className="value">{tuitionData?.tuition_due_day || '-'}일</span>
                    </div>
                </div>

                <div className="history-list">
                    {loading ? (
                        [1, 2, 3].map((i) => (
                            <div key={i} className="history-item skeleton-item shimmer">
                                <div className="skeleton-icon"></div>
                                <div className="skeleton-info">
                                    <div className="skeleton-line"></div>
                                    <div className="skeleton-line short"></div>
                                </div>
                            </div>
                        ))
                    ) : tuitionData?.records && tuitionData.records.length > 0 ? (
                        tuitionData.records.map((item: any, idx: number) => (
                            <div key={idx} className="history-item">
                                <div className={`icon-status ${item.status}`}>
                                    {item.status === 'paid' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                </div>
                                <div className="info-box">
                                    <div className="title-row">
                                        <span className="month-title">{item.year}년 {item.month}월 수강료</span>
                                        <span className={`status-badge ${item.status}`}>
                                            {item.status === 'paid' ? '납부완료' : '미납'}
                                        </span>
                                    </div>
                                    <div className="date-info">
                                        <Calendar size={14} />
                                        <span>
                                            {item.status === 'paid'
                                                ? `납부일: ${new Date(item.payment_date).toLocaleDateString()}`
                                                : `납부 약정일: 매월 ${tuitionData.tuition_due_day}일`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <CreditCard size={48} />
                            <p>기록된 수강료 납부 이력이 없습니다.</p>
                        </div>
                    )}
                </div>

                <div className="help-box">
                    <p>수강료 관련 문의는 학원 행정실로 연락 부탁드립니다.</p>
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
                    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                    border-radius: 1.25rem;
                    padding: 1.5rem;
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                    color: white;
                    margin-bottom: 1.5rem;
                    box-shadow: 0 10px 15px -3px rgba(30, 41, 59, 0.2);
                }
                .banner-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                }
                .banner-item .label { font-size: 0.85rem; opacity: 0.8; }
                .banner-item .value { font-size: 1.5rem; font-weight: 800; }
                .banner-divider { width: 1px; height: 30px; background: rgba(255,255,255,0.1); }

                .history-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .history-item {
                    background: white;
                    border-radius: 1rem;
                    padding: 1.25rem;
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .icon-status.paid { color: #10b981; }
                .icon-status.unpaid { color: #f87171; }
                
                .info-box { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
                .title-row { display: flex; align-items: center; justify-content: space-between; }
                .month-title { font-size: 1rem; font-weight: 700; color: #1e293b; }
                .status-badge {
                    font-size: 0.75rem;
                    font-weight: 700;
                    padding: 0.15rem 0.5rem;
                    border-radius: 0.5rem;
                }
                .status-badge.paid { background: #dcfce7; color: #166534; }
                .status-badge.unpaid { background: #fee2e2; color: #991b1b; }
                
                .date-info { display: flex; align-items: center; gap: 0.35rem; font-size: 0.85rem; color: #64748b; }
                
                .help-box {
                    margin-top: 2rem;
                    padding: 1rem;
                    background: #f1f5f9;
                    border-radius: 1rem;
                    text-align: center;
                }
                .help-box p { font-size: 0.85rem; color: #64748b; margin: 0; }

                .shimmer {
                    background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }
                @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                
                .skeleton-item { border: none; box-shadow: none; background: transparent !important; }
                .skeleton-icon { width: 44px; height: 44px; background: #f1f5f9; border-radius: 50%; }
                .skeleton-info { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
                .skeleton-line { height: 1.1rem; background: #f1f5f9; border-radius: 0.25rem; width: 80%; }
                .skeleton-line.short { width: 50%; }

                .empty-state { text-align: center; padding: 4rem 1rem; color: #94a3b8; }
                .empty-state p { margin-top: 1rem; }
            `}</style>
        </div>
    );
}
