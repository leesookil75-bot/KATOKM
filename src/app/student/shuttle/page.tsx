"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronLeft, Info, AlertCircle } from 'lucide-react';

const ParentShuttleMapClient = dynamic(
    () => import('@/components/ParentShuttleMapClient'),
    { ssr: false, loading: () => <div className="map-loading">지도 로딩 중...</div> }
);

export default function StudentShuttlePage() {
    const router = useRouter();
    const [shuttleInfo, setShuttleInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                 const sessionRes = await fetch("/api/auth/session");
                 if (!sessionRes.ok) {
                     router.push("/login");
                     return;
                 }
                 const sessionData = await sessionRes.json();
                 
                 // Security check - allow students
                 if (sessionData.user.role !== 'STUDENT') {
                     router.push("/login");
                     return;
                 }
                 
                 const res = await fetch(`/api/parent/shuttle`);
                 if (res.ok) {
                     const data = await res.json();
                     if (data.assigned) setShuttleInfo(data.info);
                 }
            } catch(e) {
                 console.error(e);
            } finally {
                 setLoading(false);
            }
        }
        fetchData();
    }, [router]);

    if (loading) {
         return <div className="map-loading">데이터를 불러오는 중입니다...</div>;
    }

    if (!shuttleInfo) {
        return (
            <div className="shuttle-page not-assigned">
                <header className="fixed-header">
                    <button onClick={() => router.back()} className="back-btn"><ChevronLeft size={24} /></button>
                    <h1>내 셔틀 보기</h1>
                </header>
                <div className="empty-state">
                    <AlertCircle size={48} color="#94a3b8" />
                    <h2>배정된 노선이 없습니다</h2>
                    <p>현재 배정받은 셔틀 탑승 정류장이 없습니다.<br/>학원에 문의해주세요.</p>
                    <Link href="/student" className="home-btn">대시보드로 돌아가기</Link>
                </div>
                <style jsx>{styles}</style>
            </div>
        );
    }

    return (
        <div className="shuttle-page">
            <header className="fixed-header">
                <button onClick={() => router.back()} className="back-btn"><ChevronLeft size={24} /></button>
                <h1>노선: {shuttleInfo.route_name}</h1>
            </header>

            <div className="map-container-wrapper">
                <div className={`map-overlay ${shuttleInfo.is_driving ? 'driving' : 'standby'}`}>
                    {shuttleInfo.is_driving ? (
                        <div className="driving-badge">차량 이동 중 🚌</div>
                    ) : (
                        <div className="standby-curtain">
                            <Info size={40} />
                            <h2>셔틀 출발 대기 중이에요!</h2>
                            <p>기사님이 운행을 시작하시면<br/>지도를 통해 실시간 위치를 볼 수 있어요.</p>
                        </div>
                    )}
                </div>
                <ParentShuttleMapClient shuttleInfo={shuttleInfo} />
            </div>

            <div className="info-panel">
                <div className="panel-row">
                    <span className="label">내 승차 정류장</span>
                    <span className="value text-primary">{shuttleInfo.stop_name}</span>
                </div>
                <div className="panel-row">
                    <span className="label">승차 예정 시간</span>
                    <span className="value bold">{shuttleInfo.arrival_time}</span>
                </div>
            </div>
            <style jsx>{styles}</style>
        </div>
    );
}

const styles = `
    .shuttle-page {
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: #f8fafc;
        position: relative;
    }
    .fixed-header {
        display: flex;
        align-items: center;
        padding: 1rem;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        z-index: 10;
    }
    .back-btn {
        background: none; border: none; cursor: pointer;
        color: #1e293b;
        margin-right: 1rem;
        display: flex;
        align-items: center;
        padding: 0;
    }
    h1 { font-size: 1.1rem; font-weight: 700; margin: 0; color: #1e293b; }
    
    .map-container-wrapper {
        flex: 1;
        position: relative;
        z-index: 1;
    }
    .map-overlay {
        position: absolute;
        inset: 0;
        z-index: 500;
        pointer-events: none;
    }
    .map-overlay.driving { pointer-events: none; }
    .map-overlay.standby { 
        pointer-events: auto;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .driving-badge {
        position: absolute;
        top: 1rem; left: 50%;
        transform: translateX(-50%);
        background: #3b82f6;
        color: white;
        padding: 0.5rem 1.5rem;
        border-radius: 2rem;
        font-weight: 700;
        font-size: 0.9rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .standby-curtain {
        text-align: center;
        color: #475569;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }
    .standby-curtain h2 { font-size: 1.3rem; font-weight: 800; color: #1e293b; margin: 0; }
    .standby-curtain p { font-size: 0.95rem; line-height: 1.5; margin: 0; color: #64748b; font-weight: 500; }
    
    .info-panel {
        background: white;
        padding: 1.5rem;
        border-radius: 1.5rem 1.5rem 0 0;
        box-shadow: 0 -4px 10px rgba(0,0,0,0.05);
        z-index: 10;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    .panel-row { display: flex; justify-content: space-between; align-items: center; }
    .mt-2 { margin-top: 0.5rem; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; }
    .label { font-size: 0.9rem; color: #64748b; font-weight: 500; }
    .value { font-size: 1.05rem; color: #1e293b; }
    .text-primary { color: #3b82f6; font-weight: 700; }
    .bold { font-weight: 800; }
    
    .empty-state {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 2rem;
        gap: 1rem;
    }
    .empty-state h2 { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0; }
    .empty-state p { font-size: 0.95rem; color: #64748b; line-height: 1.5; margin: 0; }
    .home-btn { 
        margin-top: 1rem; background: #e2e8f0; color: #475569; 
        padding: 0.75rem 1.5rem; border-radius: 1rem; font-weight: 600; text-decoration: none;
    }
    .map-loading { height: 100vh; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-weight: 500; }
`;
