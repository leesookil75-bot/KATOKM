"use client";

import { useState, useEffect, useRef } from 'react';
import { Play, Square, MapPin, Bus } from 'lucide-react';

// Haversine formula to calculate distance in meters
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; 
}

export default function DriverShuttlePage() {
    const [routes, setRoutes] = useState<any[]>([]);
    const [stops, setStops] = useState<any[]>([]);
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [isDriving, setIsDriving] = useState(false);
    
    const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
    const [notifiedStops, setNotifiedStops] = useState<Set<string>>(new Set());
    
    // Boarding State
    const [boardedStudents, setBoardedStudents] = useState<Set<string>>(new Set());
    const [isBoarding, setIsBoarding] = useState<string | null>(null);

    const watchIdRef = useRef<number | null>(null);

    // Fetch routes
    useEffect(() => {
        fetch('/api/shuttles/location')
            .then(res => res.json())
            .then(data => {
                if (data.routes) setRoutes(data.routes);
            })
            .catch(err => console.error("Failed to fetch routes", err));
    }, []);

    // Fetch stops when route is selected
    useEffect(() => {
        if (!selectedRouteId) {
            setStops([]);
            return;
        }
        fetch(`/api/shuttles/stops?routeId=${selectedRouteId}`)
            .then(res => res.json())
            .then(data => {
                if (data.stops) setStops(data.stops);
            })
            .catch(err => console.error("Failed to fetch stops", err));
    }, [selectedRouteId]);

    const startDriving = () => {
        if (!selectedRouteId) return alert('노선을 선택해주세요.');
        if (!navigator.geolocation) return alert('GPS 기능을 지원하지 않는 브라우저입니다.');

        setIsDriving(true);
        setNotifiedStops(new Set()); // Reset automatic stop notifications
        setBoardedStudents(new Set()); // Reset boardings for a fresh run

        watchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setCurrentLocation({ lat, lng });

                // 1. Update Backend Location
                fetch('/api/shuttles/location', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ routeId: selectedRouteId, lat, lng })
                });

                // 2. Geofencing Check (Optional automated stop-arrival notification)
                stops.forEach(stop => {
                    if (notifiedStops.has(stop.id)) return;
                    const dist = getDistanceInMeters(lat, lng, stop.lat, stop.lng);
                    if (dist <= 500) {
                        fetch('/api/shuttles/notify-stop', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ 
                                stopId: stop.id, 
                                routeName: routes.find(r => r.id === selectedRouteId)?.route_name || '셔틀', 
                                stopName: stop.stop_name 
                            })
                        });
                        setNotifiedStops(prev => new Set(prev).add(stop.id));
                    }
                });
            },
            (error) => {
                console.error("GPS Error:", error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    };

    const stopDriving = () => {
        setIsDriving(false);
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setCurrentLocation(null);
    };

    const handleBoard = async (studentId: string, stopName: string) => {
        setIsBoarding(studentId);
        try {
            const res = await fetch('/api/driver/shuttles/board', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, stopName })
            });

            if (res.ok) {
                setBoardedStudents(prev => new Set(prev).add(studentId));
            } else {
                alert('알림 전송에 실패했습니다. (네트워크 확인)');
            }
        } catch(e) {
            alert('인터넷 연결 오류로 알림을 보내지 못했습니다.');
        } finally {
            setIsBoarding(null);
        }
    };

    return (
        <div className="driver-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title"><Bus size={24} style={{ display: 'inline', marginRight: '8px' }}/>기사님 운행 패널</h1>
                    <p className="page-description">안전 운행하세요. 우측 하단의 운행 시작을 누르면 GPS 위치가 전송됩니다.</p>
                </div>
            </header>

            <div className="controls-card">
                <label className="route-label">운행할 노선 선택</label>
                <select 
                    className="route-select"
                    value={selectedRouteId || ''}
                    onChange={(e) => setSelectedRouteId(e.target.value)}
                    disabled={isDriving}
                >
                    <option value="">노선을 선택하세요...</option>
                    {routes.map(r => (
                        <option key={r.id} value={r.id}>{r.route_name}</option>
                    ))}
                </select>

                <div className="status-indicator">
                    <div className={`status-dot ${isDriving ? 'driving' : 'stopped'}`}></div>
                    <span>{isDriving ? '현재 운행 중 (GPS 송신 중)' : '운행 대기 중'}</span>
                </div>

                {currentLocation && (
                    <div className="location-info">
                        <MapPin size={16} /> 
                        현재 내 위치: 실시간 동기화 중 ({currentLocation.lat.toFixed(5)})
                    </div>
                )}

                <div className="action-buttons">
                    {!isDriving ? (
                        <button className="primary-btn start-btn" onClick={startDriving} disabled={!selectedRouteId}>
                            <Play size={20} /> 운행 시작
                        </button>
                    ) : (
                        <button className="secondary-btn stop-btn" onClick={stopDriving}>
                            <Square size={20} /> 운행 종료
                        </button>
                    )}
                </div>
            </div>

            {isDriving && stops.length > 0 && (
                <div className="boarding-panel">
                    <h2 className="panel-title">👥 승차 학생 관리 (탑승 명단)</h2>
                    
                    {stops.map((stop, idx) => (
                        <div key={stop.id} className="stop-boarding-card">
                            <div className="stop-name">{idx + 1}. {stop.stop_name}</div>
                            
                            {stop.passengers && stop.passengers.length > 0 ? (
                                <div className="passenger-list">
                                    {stop.passengers.map((p: any) => {
                                        const isBoarded = boardedStudents.has(p.id);
                                        return (
                                            <div key={p.id} className="passenger-row">
                                                <div className="passenger-info">
                                                    <span className="passenger-name">{p.name} 학생</span>
                                                </div>
                                                <button 
                                                    className={`board-btn ${isBoarded ? 'boarded' : ''}`}
                                                    onClick={() => handleBoard(p.id, stop.stop_name)}
                                                    disabled={isBoarded || isBoarding === p.id}
                                                >
                                                    {isBoarding === p.id ? '전송중...' : isBoarded ? '✅ 승차 완료' : '🚸 탑승 알림'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="no-passengers">해당 정류장 탑승 예정 없음</div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .driver-container { padding: 1.5rem; max-width: 600px; margin: 0 auto; padding-bottom: 5rem; }
                .controls-card {
                    background: white; border-radius: 12px; padding: 2rem;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-top: 2rem; border: 1px solid #e2e8f0;
                }
                .route-label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #4b5563; }
                .route-select {
                    width: 100%; padding: 1rem; border-radius: 8px; border: 2px solid #e5e7eb;
                    font-size: 1.1rem; margin-bottom: 1.5rem; outline: none; transition: border-color 0.2s;
                }
                .route-select:focus { border-color: #8b5cf6; }
                .action-buttons { display: flex; gap: 1rem; margin-top: 2rem; }
                .start-btn { flex: 1; background: #22c55e; height: 60px; font-size: 1.2rem; border-radius: 8px; border: none; color: white; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.3); transition: transform 0.1s; }
                .start-btn:active { transform: scale(0.98); }
                .start-btn:disabled { background: #9ca3af; box-shadow: none; cursor: not-allowed; }
                
                .stop-btn { flex: 1; background: #ef4444; color: white; height: 60px; font-size: 1.2rem; border: none; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; font-weight: 700; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3); }
                
                .status-indicator { display: flex; align-items: center; gap: 0.75rem; font-weight: 700; font-size: 1.1rem; color: #374151; }
                .status-dot { width: 14px; height: 14px; border-radius: 50%; }
                .status-dot.driving { background: #22c55e; box-shadow: 0 0 12px #22c55e; animation: pulse 1.5s infinite; }
                .status-dot.stopped { background: #9ca3af; }
                .location-info { display: flex; align-items: center; gap: 8px; margin-top: 1rem; color: #6b7280; font-size: 0.95rem; background: #f3f4f6; padding: 0.75rem; border-radius: 8px; }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

                /* Boarding Panel Styles */
                .boarding-panel { margin-top: 2.5rem; }
                .panel-title { font-size: 1.4rem; font-weight: 800; color: #1e293b; margin-bottom: 1.5rem; }
                .stop-boarding-card { background: white; border-radius: 12px; margin-bottom: 1.5rem; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
                .stop-name { background: #f8fafc; padding: 1rem 1.25rem; font-weight: 700; font-size: 1.1rem; color: #334155; border-bottom: 1px solid #e2e8f0; }
                
                .passenger-list { display: flex; flex-direction: column; }
                .passenger-row { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; border-bottom: 1px solid #f1f5f9; }
                .passenger-row:last-child { border-bottom: none; }
                .passenger-name { font-size: 1.2rem; font-weight: 700; color: #0f172a; }
                
                .board-btn { 
                    background: #8b5cf6; color: white; border: none; padding: 0.75rem 1.25rem; 
                    border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; 
                    transition: all 0.2s; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.25);
                }
                .board-btn:active { transform: translateY(2px); }
                .board-btn.boarded { background: #10b981; box-shadow: none; pointer-events: none; }
                
                .no-passengers { padding: 1.5rem; text-align: center; color: #94a3b8; font-weight: 500; }
            `}</style>
        </div>
    );
}
