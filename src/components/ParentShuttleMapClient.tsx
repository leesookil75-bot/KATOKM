'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import L from 'leaflet';

const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

interface ParentShuttleMapClientProps {
    shuttleInfo: any;
}

export default function ParentShuttleMapClient({ shuttleInfo }: ParentShuttleMapClientProps) {
    const [busPos, setBusPos] = useState<{lat: number, lng: number} | null>(null);

    useEffect(() => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
    }, []);

    // Set initial bus pos
    useEffect(() => {
        if (shuttleInfo && shuttleInfo.current_lat) {
            setBusPos({ lat: shuttleInfo.current_lat, lng: shuttleInfo.current_lng });
        }
    }, [shuttleInfo]);

    // Poll for bus updates
    useEffect(() => {
        if (!shuttleInfo || !shuttleInfo.is_driving) return;

        const interval = setInterval(async () => {
            try {
                // Fetch the updated route info without exposing all routes
                const res = await fetch(`/api/parent/shuttle`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.assigned && data.info.current_lat) {
                        setBusPos({ lat: data.info.current_lat, lng: data.info.current_lng });
                    }
                }
            } catch(e) {}
        }, 5000); // refresh every 5 seconds

        return () => clearInterval(interval);
    }, [shuttleInfo]);

    const busIcon = new L.divIcon({
        html: `<div style="font-size: 30px; filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.4)); animation: pulse 2s infinite;">🚌</div>
               <style>@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }</style>`,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });

    const stopIcon = new L.divIcon({
        html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
                <div style="background: #ef4444; color: white; padding: 4px 10px; border-radius: 8px; font-size: 13px; font-weight: bold; white-space: nowrap; box-shadow: 0 3px 6px rgba(0,0,0,0.15); margin-bottom: 2px;">
                    내 정류장 (${shuttleInfo.arrival_time})
                </div>
                <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #ef4444; margin-bottom: 2px;"></div>
                <div style="font-size: 30px; filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.5));">📍</div>
            </div>
        `,
        className: '',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });

    const centerLat = busPos ? busPos.lat : shuttleInfo.stop_lat || 37.5665;
    const centerLng = busPos ? busPos.lng : shuttleInfo.stop_lng || 126.9780;

    return (
        <MapContainer center={[centerLat, centerLng]} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
            />
            {busPos && shuttleInfo.is_driving && (
                <Marker position={[busPos.lat, busPos.lng]} icon={busIcon} />
            )}
            {shuttleInfo.stop_lat && shuttleInfo.stop_lng && (
                <Marker position={[shuttleInfo.stop_lat, shuttleInfo.stop_lng]} icon={stopIcon} />
            )}
            <AutoPan busPos={busPos} />
        </MapContainer>
    );
}

function AutoPan({ busPos }: { busPos: any }) {
    const map = useMap();
    useEffect(() => {
        if (busPos) {
            map.flyTo([busPos.lat, busPos.lng], map.getZoom());
        }
    }, [busPos, map]);
    return null;
}
