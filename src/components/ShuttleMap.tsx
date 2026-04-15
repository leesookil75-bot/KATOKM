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

    const createStopIcon = (isEditing: boolean) => new L.divIcon({
        html: `<div style="font-size: ${isEditing ? '40px' : '30px'}; filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.5)); transform: translate(-50%, -100%);">📍</div>`,
        className: '',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        popupAnchor: [0, -30],
    });

    // Auto Pan Component
    const AutoPanManager = () => {
        const map = useMap();
        useEffect(() => {
            if (editingLocationStopId && activeStops.length > 0) {
                const stop = activeStops.find(s => s.id === editingLocationStopId);
                if (stop) {
                    map.flyTo([stop.lat || 37.566, stop.lng || 126.978], 17, { animate: true, duration: 1 });
                }
            }
        }, [editingLocationStopId, activeStops, map]);
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

            {/* Render Stops */}
            {activeStops.map((stop, idx) => {
                const isEditing = editingLocationStopId === stop.id;
                
                return (
                    <Marker 
                        key={`stop-${stop.id || idx}`} 
                        position={[stop.lat || 37.566, stop.lng || 126.978]}
                        icon={createStopIcon(isEditing)}
                        draggable={isEditing}
                        eventHandlers={{
                            dragend: (e) => {
                                const marker = e.target;
                                const pos = marker.getLatLng();
                                if (onLocationUpdated) {
                                    onLocationUpdated(stop.id, pos.lat, pos.lng);
                                }
                            }
                        }}
                    >
                        <Popup>
                            <strong>{stop.stop_name}</strong><br/>
                            예정 시간: {stop.arrival_time}
                            {isEditing && <div style={{color:'red', marginTop:'5px'}}>📍 핀을 드래그해서 옮기세요!</div>}
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
