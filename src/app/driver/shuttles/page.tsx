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
        setNotifiedStops(new Set()); // Reset notifications

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

                // 2. Geofencing Check
                stops.forEach(stop => {
                    if (notifiedStops.has(stop.id)) return;
                    const dist = getDistanceInMeters(lat, lng, stop.lat, stop.lng);
                    if (dist <= 500) {
                        // Notify
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

    return (
        <div className="driver-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title"><Bus size={24} style={{ display: 'inline', marginRight: '8px' }}/>기사님 운행 패널</h1>
                    <p className="page-description">안전 운행하세요. 우측 하단의 운행 시작을 누르면 학부모님께 위치가 전송됩니다.</p>
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
                    <div className={\`status-dot \${isDriving ? 'driving' : 'stopped'}\`}></div>
                    <span>{isDriving ? '현재 운행 중 (GPS 송신 중)' : '운행 대기 중'}</span>
                </div>

                {currentLocation && (
                    <div className="location-info">
                        <MapPin size={16} /> 
                        GPS 수신됨: {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
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

            <style jsx>{\`
                .driver-container { padding: 1.5rem; max-width: 600px; margin: 0 auto; }
                .controls-card {
                    background: white; border-radius: 12px; padding: 2rem;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05); mt: 2rem;
                }
                .route-label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #4b5563; }
                .route-select {
                    width: 100%; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #d1d5db;
                    font-size: 1rem; margin-bottom: 1.5rem; outline: none;
                }
                .action-buttons { display: flex; gap: 1rem; margin-top: 2rem; }
                .start-btn { flex: 1; background: #22c55e; height: 56px; font-size: 1.1rem; }
                .stop-btn { flex: 1; background: #ef4444; color: white; height: 56px; font-size: 1.1rem; border: none; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; font-weight: 600; }
                .status-indicator { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 1.1rem; }
                .status-dot { width: 12px; height: 12px; border-radius: 50%; }
                .status-dot.driving { background: #22c55e; box-shadow: 0 0 10px #22c55e; animation: pulse 1.5s infinite; }
                .status-dot.stopped { background: #9ca3af; }
                .location-info { display: flex; align-items: center; gap: 4px; margin-top: 1rem; color: #6b7280; font-size: 0.9rem; }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
            \`}</style>
        </div>
    );
}
