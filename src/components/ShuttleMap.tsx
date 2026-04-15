'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Next.js/Webpack
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

export default function ShuttleMap({ liveRoutes }: { liveRoutes: any[] }) {
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

    // Default center to a location in Seoul if no routes, else center on the first route
    const centerLat = liveRoutes.length > 0 ? liveRoutes[0].current_lat : 37.566826;
    const centerLng = liveRoutes.length > 0 ? liveRoutes[0].current_lng : 126.9786567;

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
        </MapContainer>
    );
}
