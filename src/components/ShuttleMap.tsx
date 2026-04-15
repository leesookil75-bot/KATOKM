'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

    const busIcon = new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png', // A free bus icon URL
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });

    const stopIcon = new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/1055/1055034.png', // A free map pin icon URL
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
    });

    // Default center
    // 1. If bus is live, center on bus
    // 2. Else if stops exist, center on first stop
    // 3. Defaults to Seoul Center
    const centerLat = liveRoutes.length > 0 ? liveRoutes[0].current_lat : (activeStops.length > 0 ? activeStops[0].lat : 37.566826);
    const centerLng = liveRoutes.length > 0 ? liveRoutes[0].current_lng : (activeStops.length > 0 ? activeStops[0].lng : 126.9786567);

    return (
        <MapContainer 
            center={[centerLat, centerLng]} 
            zoom={14} 
            style={{ width: "100%", height: "100%", zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
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
                        icon={stopIcon}
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
