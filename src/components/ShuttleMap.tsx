'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Next.js/Webpack
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

interface ShuttleMapProps {
    liveRoutes: any[];
    activeStops?: any[];
    editingLocationStopId?: number | null;
    onLocationUpdated?: (stopId: number, lat: number, lng: number) => void;
}

export default function ShuttleMap({ liveRoutes, activeStops = [], editingLocationStopId, onLocationUpdated }: ShuttleMapProps) {
    useEffect(() => {
        // Fix for missing default markers in react-leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl,
            iconUrl,
            shadowUrl,
        });
    }, []);

    const busIcon = new L.divIcon({
        html: `<div style="font-size: 30px; filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.4));">🚌</div>`,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15],
    });

    const createStopIcon = (stop: any) => {
        const passengers = stop.passengers || [];
        const hasPassengers = passengers.length > 0;
        const passengerText = hasPassengers ? passengers.map((p: any) => p.name).join(', ') : '미지정';
        const bgColor = hasPassengers ? '#8b5cf6' : '#94a3b8';

        const html = `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
                <div style="background: ${bgColor}; color: white; padding: 4px 10px; border-radius: 8px; font-size: 13px; font-weight: bold; white-space: nowrap; box-shadow: 0 3px 6px rgba(0,0,0,0.15); text-align: center; margin-bottom: 2px;">
                    👩‍👦 ${passengerText}
                </div>
                <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid ${bgColor}; margin-bottom: 2px;"></div>
                <div style="font-size: 30px; filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.5));">📍</div>
            </div>
        `;

        return new L.divIcon({
            html: html,
            className: '',
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -50],
        });
    };

    // Auto Pan Component
    const AutoPanManager = () => {
        const map = useMap();
        const prevEditingIdRef = useRef<number | null>(null);
        
        useEffect(() => {
            if (editingLocationStopId && editingLocationStopId !== prevEditingIdRef.current && activeStops.length > 0) {
                const stop = activeStops.find(s => s.id === editingLocationStopId);
                if (stop) {
                    map.flyTo([stop.lat || 37.566, stop.lng || 126.978], 17, { animate: true, duration: 0.5 });
                }
            }
            prevEditingIdRef.current = editingLocationStopId || null;
        }, [editingLocationStopId, activeStops, map]);
        return null;
    };
    
    // Crosshair & Save Button Component for Map Editing
    const CrosshairOverlay = () => {
        const map = useMap();
        const [isMapMoving, setIsMapMoving] = useState(false);

        useEffect(() => {
            if (!editingLocationStopId) return;
            const handleMoveStart = () => setIsMapMoving(true);
            const handleMoveEnd = () => setIsMapMoving(false);
            
            map.on('movestart', handleMoveStart);
            map.on('moveend', handleMoveEnd);
            
            return () => {
                map.off('movestart', handleMoveStart);
                map.off('moveend', handleMoveEnd);
            };
        }, [editingLocationStopId, map]);

        if (!editingLocationStopId) return null;
        const stop = activeStops.find(s => s.id === editingLocationStopId);
        const passengers = stop?.passengers || [];
        const hasPassengers = passengers.length > 0;
        const passengerText = hasPassengers ? passengers.map((p: any) => p.name).join(', ') : '미지정';
        const bgColor = hasPassengers ? '#8b5cf6' : '#ef4444'; // Red when editing empty stop for better visibility

        return (
            <>
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, calc(-100% - ${isMapMoving ? '15px' : '0px'}))`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    zIndex: 1000, pointerEvents: 'none', transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
                }}>
                    <div style={{
                        background: bgColor, color: 'white', padding: '6px 12px', borderRadius: '8px', 
                        fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', 
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)', textAlign: 'center', marginBottom: '2px'
                    }}>
                        {stop?.stop_name} (👩‍👦 {passengerText})
                    </div>
                    <div style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: \`8px solid \${bgColor}\`, marginBottom: '4px' }}></div>
                    <div style={{ fontSize: '45px', filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.5))' }}>📍</div>
                </div>
                <div style={{
                    position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 1000
                }}>
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const currentCenter = map.getCenter();
                            if (onLocationUpdated) {
                                onLocationUpdated(editingLocationStopId, currentCenter.lat, currentCenter.lng);
                                alert("위치가 변경되었습니다!");
                            }
                        }}
                        style={{
                            background: '#8b5cf6', color: 'white', border: 'none', padding: '14px 28px',
                            borderRadius: '30px', fontWeight: 'bold', fontSize: '1.2rem',
                            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)', cursor: 'pointer',
                            transition: 'transform 0.1s'
                        }}
                        onMouseDown={e => e.currentTarget.style.transform = 'translateX(-50%) scale(0.95)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
                    >
                        ✓ 이 위치로 확정
                    </button>
                </div>
            </>
        );
    };

    // Auto Resize Component
    const MapResizer = () => {
        const map = useMap();
        useEffect(() => {
            const resizeObserver = new ResizeObserver(() => {
                map.invalidateSize();
            });
            resizeObserver.observe(map.getContainer());
            return () => resizeObserver.disconnect();
        }, [map]);
        return null;
    };

    // Default center
    // 1. If bus is live, center on bus
    // 2. Else if stops exist, center on first stop
    // 3. Defaults to Seoul Center
    const centerLat = liveRoutes.length > 0 ? liveRoutes[0].current_lat : (activeStops.length > 0 ? activeStops[0].lat : 37.566826);
    const centerLng = liveRoutes.length > 0 ? liveRoutes[0].current_lng : (activeStops.length > 0 ? activeStops[0].lng : 126.9786567);

    return (
        <MapContainer 
            center={[centerLat, centerLng]} 
            zoom={17} 
            style={{ width: "100%", height: "100%", zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapResizer />
            <AutoPanManager />

            {liveRoutes.map((route, idx) => (
                <Marker 
                    key={route.id || idx} 
                    position={[route.current_lat, route.current_lng]}
                    icon={busIcon}
                >
                    <Popup>
                        <strong>{route.route_name || '운행 차량'}</strong><br/>
                        속도: {route.speed || 0} km/h
                    </Popup>
                </Marker>
            ))}

            <CrosshairOverlay />

            {/* Render Stops */}
            {activeStops.map((stop, idx) => {
                const isEditing = editingLocationStopId === stop.id;
                if (isEditing) return null; // 편집 중인 마커는 중앙의 고정된 크로스헤어로 대체됩니다.
                
                return (
                    <Marker 
                        key={`stop-${stop.id || idx}`} 
                        position={[stop.lat || 37.566, stop.lng || 126.978]}
                        icon={createStopIcon(stop)}
                    >
                        <Popup>
                            <strong>{stop.stop_name}</strong><br/>
                            예정 시간: {stop.arrival_time}
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
