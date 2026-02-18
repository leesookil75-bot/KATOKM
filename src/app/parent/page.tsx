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
    UserCircle,
    AlertCircle,
    Circle,
    Triangle,
    X,
    Bell
} from "lucide-react";
import Link from "next/link";

const VAPID_PUBLIC_KEY = 'BH749OlOysQPYPpdxUa45W1XShrSsqreU6ohU3vhdvPNFyAL1Y_SGPj6vKv84VtII_Jl8R3Q5RxuvkR9Zywds2c';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

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

    const [notifications, setNotifications] = useState<any[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [activePopup, setActivePopup] = useState<any>(null);

    useEffect(() => {
        // Real-time listener for app-in-use popups
        const channel = new BroadcastChannel('push-notification');
        channel.onmessage = (event) => {
            const data = event.data;
            setActivePopup(data);

            // Play sound - a simple polite beep
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.5);

            // Auto-hide popup after 5 seconds
            setTimeout(() => setActivePopup(null), 5000);

            // Refresh history
            fetchNotifications();
        };

        return () => channel.close();
    }, []);

    async function fetchNotifications() {
        try {
            const res = await fetch('/api/parent/notifications');
            if (res.ok) setNotifications(await res.json());
        } catch (e) { console.error(e); }
    }

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
                const today = now.toLocaleDateString('sv');
                const currentYear = now.getFullYear();

                const [attendanceRes, tuitionRes] = await Promise.all([
                    fetch(`/api/attendance`),
                    fetch(`/api/tuition?year=${currentYear}`)
                ]);

                if (attendanceRes.ok) {
                    const attendanceData = await attendanceRes.json();
                    const todayRecord = attendanceData.find((r: any) => {
                        const recDate = new Date(r.date);
                        return recDate.toLocaleDateString('sv') === today;
                    });
                    setTodayAttendance(todayRecord);
                }

                if (tuitionRes.ok) {
                    const tuitionData = await tuitionRes.json();
                    setTuitionSummary(tuitionData);
                }

                await fetchNotifications();

                // Register Push Subscription
                if ('serviceWorker' in navigator && 'PushManager' in window) {
                    const registration = await navigator.serviceWorker.ready;
                    let subscription = await registration.pushManager.getSubscription();

                    if (!subscription) {
                        try {
                            subscription = await registration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                            });

                            await fetch('/api/push/subscribe', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ subscription })
                            });
                        } catch (pushErr) {
                            console.error('[Push-Registration] Failed:', pushErr);
                        }
                    }
                }
            } catch (err) {
                console.error('[ParentApp Fetch Error]:', err);
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
                <div className="header-actions">
                    <button onClick={() => { setIsHistoryOpen(true); fetchNotifications(); }} className="bell-btn">
                        <Bell size={24} />
                        {notifications.length > 0 && <span className="bell-badge" />}
                    </button>
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={20} />
                    </button>
                </div>
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
                                <div className={`status-badge ${todayAttendance.status === '출석' ? 'present' :
                                    todayAttendance.status === '특이사항' ? 'special' : 'absent'
                                    }`}>
                                    {todayAttendance.status === '출석' ? <Circle size={48} strokeWidth={3} /> :
                                        todayAttendance.status === '특이사항' ? <Triangle size={48} strokeWidth={3} /> :
                                            <X size={48} strokeWidth={3} />}
                                    <span>
                                        {todayAttendance.status === '출석' ? '출석 완료' :
                                            todayAttendance.status === '특이사항' ? '특이사항' : '결석'}
                                    </span>
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

            {/* Notification History Modal */}
            {isHistoryOpen && (
                <div className="modal-overlay" onClick={() => setIsHistoryOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>알림 내역 (최근 10개)</h3>
                            <button onClick={() => setIsHistoryOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body history-list">
                            {notifications.length === 0 ? (
                                <p className="no-history">저장된 알림이 없습니다.</p>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} className="history-item">
                                        <div className="history-meta">
                                            <span className="history-title">{n.title}</span>
                                            <span className="history-date">
                                                {new Date(n.created_at).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="history-body">{n.body}</p>
                                    </div>
                                ))
                            )}
                        </div>
                        <p className="history-info">* 30일이 지난 내역은 자동 삭제됩니다.</p>
                    </div>
                </div>
            )}

            {/* Real-time Popup Toast */}
            {activePopup && (
                <div className="popup-toast" onClick={() => setActivePopup(null)}>
                    <div className="popup-icon">🔔</div>
                    <div className="popup-content">
                        <strong>{activePopup.title}</strong>
                        <p>{activePopup.body}</p>
                    </div>
                </div>
            )}

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
                .status-badge.present { color: #2563eb; }
                .status-badge.special { color: #16a34a; }
                .status-badge.absent { color: #dc2626; }
                .status-badge span { font-weight: 800; font-size: 1.25rem; margin-top: 0.5rem; }
                
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
                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .bell-btn {
                    position: relative;
                    padding: 0.5rem;
                    color: #64748b;
                    border-radius: 0.5rem;
                    background: none;
                    border: none;
                    cursor: pointer;
                }
                .bell-badge {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 8px;
                    height: 8px;
                    background: #ef4444;
                    border-radius: 50%;
                    border: 2px solid white;
                }
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.4);
                    backdrop-filter: blur(4px);
                    z-index: 100;
                    display: flex;
                    align-items: flex-end;
                }
                .modal-content {
                    background: white;
                    width: 100%;
                    border-radius: 2rem 2rem 0 0;
                    padding: 1.5rem;
                    max-height: 80vh;
                    display: flex;
                    flex-direction: column;
                    animation: slideUp 0.3s ease-out;
                }
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .modal-header h3 { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0; }
                .history-list {
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .history-item {
                    padding: 1rem;
                    background: #f8fafc;
                    border-radius: 1rem;
                }
                .history-meta {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.4rem;
                }
                .history-title { font-weight: 700; font-size: 0.9rem; color: #4f46e5; }
                .history-date { font-size: 0.75rem; color: #94a3b8; }
                .history-body { font-size: 0.85rem; color: #334155; margin: 0; line-height: 1.4; }
                .no-history { text-align: center; padding: 3rem 0; color: #94a3b8; font-size: 0.9rem; }
                .history-info { font-size: 0.7rem; color: #94a3b8; text-align: center; margin-top: 1rem; }

                .popup-toast {
                    position: fixed;
                    top: 1rem;
                    left: 1rem;
                    right: 1rem;
                    background: white;
                    padding: 1rem;
                    border-radius: 1rem;
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
                    z-index: 200;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    border-left: 4px solid #4f46e5;
                    animation: slideInDown 0.3s ease-out;
                    cursor: pointer;
                }
                @keyframes slideInDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .popup-icon { font-size: 1.5rem; }
                .popup-content strong { display: block; font-size: 0.9rem; color: #1e293b; margin-bottom: 0.2rem; }
                .popup-content p { font-size: 0.85rem; color: #475569; margin: 0; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

                @media (min-width: 640px) {
                    .modal-overlay { align-items: center; justify-content: center; padding: 1rem; }
                    .modal-content { border-radius: 1.5rem; max-width: 480px; }
                    .popup-toast { left: auto; right: 1rem; width: 360px; }
                }
            `}</style>
        </div>
    );
}
