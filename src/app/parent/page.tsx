"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Calendar,
    CreditCard,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronRight,
    LogOut,
    UserCircle
} from "lucide-react";
import Link from "next/link";

interface Session {
    user: {
        id: string;
        username: string;
        role: string;
        student_id: string;
        student_name: string;
    };
}

export default function ParentDashboard() {
    const [session, setSession] = useState<Session | null>(null);
    const [todayAttendance, setTodayAttendance] = useState<any>(null);
    const [tuitionSummary, setTuitionSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            try {
                const sessionRes = await fetch("/api/auth/session");
                if (!sessionRes.ok) {
                    router.push("/parent/login");
                    return;
                }
                const sessionData = await sessionRes.json();
                setSession(sessionData);

                // Get local date in YYYY-MM-DD format
                const now = new Date();
                const today = now.toLocaleDateString('sv'); // 'sv' locale matches YYYY-MM-DD
                const currentYear = now.getFullYear();

                const [attendanceRes, tuitionRes] = await Promise.all([
                    fetch(`/api/attendance`),
                    fetch(`/api/tuition?year=${currentYear}`)
                ]);

                if (attendanceRes.ok) {
                    const attendanceData = await attendanceRes.json();
                    // Since it returns history for parent, find today's record
                    // Handle potential variations in date string format
                    const todayRecord = attendanceData.find((r: any) => {
                        const recordDate = new Date(r.date).toLocaleDateString('sv');
                        return recordDate === today;
                    });
                    setTodayAttendance(todayRecord);
                }

                if (tuitionRes.ok) {
                    setTuitionSummary(await tuitionRes.json());
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [router]);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/parent/login");
    };

    if (loading) return <div className="loading">데이터를 불러오는 중...</div>;

    const currentMonth = new Date().getMonth() + 1;
    const currentMonthTuition = tuitionSummary?.records?.find((r: any) => r.month === currentMonth);
    const isPaid = currentMonthTuition?.status === 'paid';

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="user-info">
                    <UserCircle size={40} color="#4f46e5" />
                    <div>
                        <h2>{session?.user.student_name} 학생 보호자님</h2>
                        <p>오늘도 좋은 하루 되세요!</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={20} />
                </button>
            </header>

            <main className="dashboard-content">
                {/* Today's Attendance Card */}
                <section className="status-card">
                    <div className="card-header">
                        <div className="icon-wrapper attendance">
                            <Calendar size={24} />
                        </div>
                        <h3>당일 출석 상태</h3>
                        <Link href="/parent/attendance" className="more-link">
                            상세보기 <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="card-body">
                        {todayAttendance ? (
                            <div className="status-badge-wrapper">
                                <div className={`status-badge ${todayAttendance.status}`}>
                                    {todayAttendance.status === 'present' ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                                    <span>{todayAttendance.status === 'present' ? '출석 완료' : '결석'}</span>
                                </div>
                                <div className="status-details">
                                    <div className="detail-item">
                                        <Clock size={16} />
                                        <span>체크 시간: {new Date(todayAttendance.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    {todayAttendance.memo && (
                                        <p className="status-memo">{todayAttendance.memo}</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="no-data">
                                <p>아직 출석 체크 전입니다.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Tuition Card */}
                <section className="status-card">
                    <div className="card-header">
                        <div className="icon-wrapper tuition">
                            <CreditCard size={24} />
                        </div>
                        <h3>수강료 납부 현황</h3>
                        <Link href="/parent/tuition" className="more-link">
                            상세보기 <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="card-body">
                        <div className="tuition-summary">
                            <div className="month-info">
                                <span className="label">{currentMonth}월 수강료</span>
                                <span className={`status-text ${isPaid ? 'paid' : 'unpaid'}`}>
                                    {isPaid ? '납부 완료' : '미납'}
                                </span>
                            </div>
                            <div className="due-info">
                                <span className="label">납부 약정일</span>
                                <span className="value">매월 {tuitionSummary?.tuition_due_day || '-'}일</span>
                            </div>
                            {isPaid && currentMonthTuition.payment_date && (
                                <div className="payment-date">
                                    <span className="label">납부 일자</span>
                                    <span className="value">{new Date(currentMonthTuition.payment_date).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            <style jsx>{`
                .dashboard-container {
                    min-height: 100vh;
                    background: #f8fafc;
                    padding-bottom: 2rem;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .loading {
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #64748b;
                }
                .dashboard-header {
                    background: white;
                    padding: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .user-info h2 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                }
                .user-info p {
                    font-size: 0.85rem;
                    color: #64748b;
                    margin: 0;
                }
                .logout-btn {
                    padding: 0.5rem;
                    color: #94a3b8;
                    border-radius: 0.5rem;
                    transition: all 0.2s;
                }
                .logout-btn:hover {
                    color: #ef4444;
                    background: #fef2f2;
                }
                .dashboard-content {
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    max-width: 600px;
                    margin: 0 auto;
                }
                .status-card {
                    background: white;
                    border-radius: 1.5rem;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                }
                .icon-wrapper {
                    width: 44px;
                    height: 44px;
                    border-radius: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .icon-wrapper.attendance { background: #e0e7ff; color: #4338ca; }
                .icon-wrapper.tuition { background: #fef3c7; color: #d97706; }
                .card-header h3 {
                    font-size: 1.05rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                    flex: 1;
                }
                .more-link {
                    font-size: 0.85rem;
                    color: #6366f1;
                    display: flex;
                    align-items: center;
                    font-weight: 600;
                }
                .status-badge-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }
                .status-badge {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                }
                .status-badge.present { color: #10b981; }
                .status-badge.absent { color: #ef4444; }
                .status-badge span { font-weight: 800; font-size: 1.25rem; }
                
                .status-details {
                    width: 100%;
                    background: #f8fafc;
                    padding: 1rem;
                    border-radius: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    color: #64748b;
                }
                .status-memo {
                    font-size: 0.85rem;
                    color: #475569;
                    border-top: 1px dashed #e2e8f0;
                    padding-top: 0.5rem;
                    margin: 0;
                }
                .no-data {
                    text-align: center;
                    padding: 2rem 0;
                    color: #94a3b8;
                    font-size: 0.95rem;
                }
                .tuition-summary {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .month-info, .due-info, .payment-date {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .label { font-size: 0.9rem; color: #64748b; }
                .status-text { font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.9rem; }
                .status-text.paid { background: #dcfce7; color: #166534; }
                .status-text.unpaid { background: #fee2e2; color: #991b1b; }
                .value { font-weight: 600; color: #1e293b; font-size: 0.95rem; }
            `}</style>
        </div>
    );
}
