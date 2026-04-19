"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, BusFront, CalendarCheck } from "lucide-react";
import Link from "next/link";

interface Session {
    user: {
        id: string;
        username: string;
        role: string;
        student_id?: string;
        student_name?: string;
        academy_name?: string;
    };
}

export default function StudentDashboard() {
    const [session, setSession] = useState<Session | null>(null);
    const [todayAttendance, setTodayAttendance] = useState<any>(null);
    const [shuttleInfo, setShuttleInfo] = useState<any>(null);
    const [dreamEnergy, setDreamEnergy] = useState<number>(36.5);
    const [dreamTier, setDreamTier] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            try {
                const sessionRes = await fetch("/api/auth/session");
                if (!sessionRes.ok) {
                    router.push("/login");
                    return;
                }
                const sessionData = await sessionRes.json();
                
                // Security check - kick out non-students
                if (sessionData.user.role !== 'STUDENT') {
                    router.push("/login");
                    return;
                }
                setSession(sessionData);

                const now = new Date();
                const today = now.toLocaleDateString('sv'); // YYYY-MM-DD format based on local time

                const [attendanceRes, shuttleRes, profileRes] = await Promise.all([
                    fetch(`/api/attendance`),
                    fetch(`/api/parent/shuttle`),
                    fetch(`/api/student/profile`)
                ]);

                if (attendanceRes.ok) {
                    const data = await attendanceRes.json();
                    const todayRecord = data.find((r: any) => new Date(r.date).toLocaleDateString('sv') === today);
                    setTodayAttendance(todayRecord);
                }

                if (shuttleRes.ok) {
                    const shuttleData = await shuttleRes.json();
                    if (shuttleData.assigned) {
                         setShuttleInfo(shuttleData.info);
                    }
                }

                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    if (profileData.success) {
                        if (profileData.student.dream_energy !== null) {
                            setDreamEnergy(Number(profileData.student.dream_energy));
                        }
                        if (profileData.student.dream_tier !== null) {
                            setDreamTier(Number(profileData.student.dream_tier));
                        }
                    }
                }

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [router]);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    };

    if (loading || !session) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <style jsx>{`
                    .loading-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
                    .spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #4f46e5; border-radius: 50%; animation: spin 1s linear infinite; }
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    const getBadge = (tier: number) => {
        if (tier === 0) return null;
        const badges = ['', '🥉 브론즈', '🥈 실버', '🥇 골드', '💎 다이아'];
        return <span className="tier-badge" title={`${tier}회 100점 달성!`}>{badges[Math.min(tier, 4)]}</span>;
    };

    return (
        <div className="student-dashboard">
            <header className="dashboard-header">
                <div>
                    <h1 className="greeting" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                        반가워요, {session.user.student_name} 학생! 👋 {getBadge(dreamTier)}
                    </h1>
                    <p className="academy-name">{session.user.academy_name}</p>
                </div>
                <button onClick={handleLogout} className="logout-btn" title="로그아웃">
                    <LogOut size={20} />
                </button>
            </header>

            <main className="dashboard-content">
                {/* Dream Energy Bar */}
                <section className="status-card energy-card" style={{ position: "relative", zIndex: 10 }}>
                    <div className="energy-header">
                        <div className="flex-center gap-xs">
                            <span style={{ fontSize: "1.2rem" }}>⚡</span>
                            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>나의 드림 에너지</h3>
                        </div>
                        <span className="energy-value">
                            {dreamEnergy.toFixed(1)} <span style={{ fontSize: "0.8rem", color: "#64748b" }}>/ 100</span>
                        </span>
                    </div>
                    <div className="energy-bar-container">
                        <div 
                            className={`energy-bar-fill ${dreamEnergy >= 90 ? 'level-dream' : dreamEnergy >= 60 ? 'level-passion' : dreamEnergy > 30 ? 'level-start' : 'level-low'}`}
                            style={{ width: `${Math.min(dreamEnergy, 100)}%` }}
                        />
                    </div>
                    <p className="energy-msg">
                        {dreamEnergy >= 90 ? "🚀 완벽해요! 꿈에 거의 다다랐어요!" : 
                         dreamEnergy >= 60 ? "🔥 열정이 넘쳐요! 지금처럼만 해요!" :
                         dreamEnergy > 30 ? "💧 좋은 출발이에요. 꾸준히 모아봐요!" : 
                         "💤 에너지가 조금 부족해요. 내일은 꼭 출석해요!"}
                    </p>
                    <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f8fafc', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                            💡 100점을 돌파하여 영광의 훈장을 모아보세요!
                        </span>
                    </div>
                </section>

                {/* Shuttle Card (Primary Feature for Students) */}
                <section className="status-card shuttle-card">
                    <div className="card-header">
                        <div className="icon-wrapper shuttle">
                            <BusFront size={24} />
                        </div>
                        <h3>나의 셔틀버스 위치</h3>
                    </div>
                    <div className="card-body">
                        {shuttleInfo ? (
                            <Link href="/student/shuttle" className="shuttle-info-box" style={{ textDecoration: 'none' }}>
                                <div className="info-row">
                                    <span className="shuttle-label">내 정류장</span>
                                    <span className="shuttle-value">📍 {shuttleInfo.stop_name}</span>
                                </div>
                                <div className="info-row mt-sm">
                                    <span className="shuttle-label">승차 예상시간</span>
                                    <span className="shuttle-value time-val">{shuttleInfo.arrival_time}</span>
                                </div>
                                {shuttleInfo.is_driving ? (
                                     <div className="driving-status active">🚌 차량 이동 중! 위치보기 👉</div>
                                ) : (
                                     <div className="driving-status standby">차량 대기(이동 전)</div>
                                )}
                            </Link>
                        ) : (
                            <div className="no-data">
                                <p>현재 배정된 셔틀 노선이 없습니다.<br/>도움이 필요하면 학원에 문의하세요!</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Today's Attendance Card */}
                <section className="status-card attendance-card">
                    <div className="card-header">
                        <div className="icon-wrapper attendance">
                            <CalendarCheck size={24} />
                        </div>
                        <h3>오늘 나의 출석 현황</h3>
                    </div>
                    <div className="card-body">
                        <div className="attendance-status">
                            {todayAttendance ? (
                                <>
                                    <div className={`status-badge ${todayAttendance.status === '출석' ? 'status-present' : 'status-absent'}`}>
                                        {todayAttendance.status}
                                    </div>
                                    <p className="status-time">오늘의 체크: {new Date(todayAttendance.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p className="status-memo">{todayAttendance.memo}</p>
                                </>
                            ) : (
                                <div className="no-attendance">
                                    <div className="empty-circle"></div>
                                    <p>아직 오늘 출석을 안 했어요!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
                
                {/* Contact Academy Button */}
                <a href="tel:" className="contact-btn" onClick={(e) => {
                    alert("이 기능은 원장님 연락처가 등록된 후 사용 가능합니다.");
                    e.preventDefault();
                }}>
                    📞 학원 데스크에 연락하기
                </a>
            </main>

            <style jsx>{`
                .student-dashboard {
                    min-height: 100vh;
                    background: #f1f5f9;
                    font-family: 'Pretendard', sans-serif;
                }
                .dashboard-header {
                    background: #3b82f6;
                    color: white;
                    padding: 2.5rem 1.5rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-radius: 0 0 2rem 2rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .greeting { font-size: 1.5rem; font-weight: 800; margin: 0 0 0.5rem 0; }
                .academy-name { margin: 0; font-size: 1rem; opacity: 0.9; }
                .logout-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 40px; height: 40px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    backdrop-filter: blur(4px);
                }
                
                .dashboard-content {
                    padding: 2rem 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    max-width: 600px;
                    margin: 0 auto;
                    margin-top: -1.5rem;
                }
                
                .status-card {
                    background: white;
                    border-radius: 1.5rem;
                    padding: 1.5rem;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                }
                .shuttle-card { border: 2px solid #3b82f6; }
                
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.25rem;
                }
                .icon-wrapper {
                    width: 48px; height: 48px;
                    border-radius: 1rem;
                    display: flex; align-items: center; justify-content: center;
                }
                .icon-wrapper.shuttle { background: #eff6ff; color: #3b82f6; }
                .icon-wrapper.attendance { background: #ecfdf5; color: #10b981; }
                .card-header h3 { font-size: 1.15rem; font-weight: 700; margin: 0; color: #1e293b; }
                
                .shuttle-info-box {
                    display: flex;
                    flex-direction: column;
                    background: #f8fafc;
                    padding: 1.25rem;
                    border-radius: 1rem;
                    transition: transform 0.2s;
                }
                .shuttle-info-box:active { transform: scale(0.98); }
                .info-row { display: flex; justify-content: space-between; align-items: center; }
                .mt-sm { margin-top: 0.5rem; }
                .shuttle-label { font-size: 0.95rem; color: #64748b; font-weight: 500; }
                .shuttle-value { font-weight: 700; color: #1e293b; font-size: 1.1rem; }
                .time-val { color: #3b82f6; font-size: 1.3rem; font-weight: 800; }
                
                .driving-status { 
                    margin-top: 1rem; text-align: center; padding: 0.8rem; 
                    border-radius: 0.75rem; font-weight: 800; font-size: 1rem;
                }
                .driving-status.active { background: #3b82f6; color: white; animation: pulse-bg 2s infinite; }
                .driving-status.standby { background: #e2e8f0; color: #64748b; }
                
                @keyframes pulse-bg {
                    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                }
                
                .attendance-status {
                    text-align: center;
                    padding: 1rem 0;
                }
                .status-badge {
                    display: inline-block;
                    padding: 0.75rem 2rem;
                    border-radius: 2rem;
                    font-size: 1.5rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                }
                .status-present { background: #10b981; color: white; }
                .status-absent { background: #ef4444; color: white; }
                .status-time { font-size: 0.95rem; color: #64748b; margin: 0; font-weight: 500; }
                .status-memo { font-size: 0.9rem; color: #94a3b8; margin: 0.5rem 0 0 0; }
                
                .no-attendance {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }
                .empty-circle {
                    width: 60px; height: 60px;
                    border: 4px dashed #cbd5e1;
                    border-radius: 50%;
                }
                .no-attendance p { margin: 0; color: #94a3b8; font-weight: 600; font-size: 1.1rem; }
                
                .no-data {
                    text-align: center;
                    padding: 2rem 0;
                    color: #94a3b8;
                    font-size: 1rem;
                    line-height: 1.5;
                    font-weight: 500;
                }
                
                .contact-btn {
                    display: block;
                    width: 100%;
                    padding: 1.25rem;
                    background: white;
                    color: #334155;
                    text-align: center;
                    text-decoration: none;
                    border-radius: 1rem;
                    font-weight: 700;
                    font-size: 1.1rem;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.02);
                }
                
                /* Dream Energy Styles */
                .tier-badge { font-size: 0.95rem; background: #fffbeb; color: #b45309; padding: 0.2rem 0.6rem; border-radius: 999px; font-weight: 800; border: 1px solid #fde68a; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .energy-card { border: 2px solid #e2e8f0; padding: 1rem 1.25rem; }
                .energy-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
                .energy-value { font-size: 1.15rem; font-weight: 800; color: #1e293b; }
                .energy-bar-container { background: #f1f5f9; height: 20px; border-radius: 999px; overflow: hidden; position: relative; margin-bottom: 0.75rem; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); }
                .energy-bar-fill { height: 100%; border-radius: 999px; transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; }
                
                /* Level Colors */
                .level-low { background: linear-gradient(90deg, #94a3b8, #cbd5e1); }
                .level-start { background: linear-gradient(90deg, #60a5fa, #3b82f6); }
                .level-passion { background: linear-gradient(90deg, #fb923c, #f97316); }
                .level-dream { background: linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6); background-size: 200% 200%; animation: gradientMove 3s ease infinite; }
                
                /* Shine effect */
                .energy-bar-fill::after {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
                    animation: shine 2s infinite;
                }
                
                .energy-msg { text-align: center; font-size: 0.95rem; font-weight: 600; color: #475569; margin: 0; }
                
                @keyframes shine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes gradientMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>
        </div>
    );
}
