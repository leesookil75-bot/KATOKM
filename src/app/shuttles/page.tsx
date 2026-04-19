"use client";

import { useEffect, useState } from 'react';
import { Plus, Trash2, MapPin, Bus } from 'lucide-react';
import dynamic from 'next/dynamic';

const ShuttleMap = dynamic(() => import('@/components/ShuttleMap'), {
    ssr: false,
    loading: () => <div className="map-loading-overlay"><span>오픈 지도를 불러오는 중입니다...</span></div>
});

export default function ShuttleManagerPage() {
    const [liveRoutes, setLiveRoutes] = useState<any[]>([]);
    const [isMapOpen, setIsMapOpen] = useState(false);
    
    // 새 노선 모달용 상태 (State)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [routes, setRoutes] = useState<any[]>([]);
    const [formData, setFormData] = useState({ route_name: '', driver_name: '', driver_phone: '', vehicle_number: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [activeRouteId, setActiveRouteId] = useState<number | null>(null);

    // 정류장용 상태 (Stops State)
    const [isStopModalOpen, setIsStopModalOpen] = useState(false);
    const [stopFormData, setStopFormData] = useState({ stop_name: '', arrival_time: '' });
    const [isSavingStop, setIsSavingStop] = useState(false);
    const [stopsDict, setStopsDict] = useState<Record<number, any[]>>({});

    // 탑승자 및 지도 수정(Map Edit) 상태
    const [editingLocationStopId, setEditingLocationStopId] = useState<number | null>(null);
    const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false);
    const [selectedStopIdForPassenger, setSelectedStopIdForPassenger] = useState<number | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [isSavingPassengers, setIsSavingPassengers] = useState(false);

    // Load saved database routes periodically (if needed, or just once)
    const fetchSavedRoutes = async () => {
        try {
            const res = await fetch('/api/shuttles/routes');
            if(res.ok) {
                const data = await res.json();
                setRoutes(data);
                if(data.length > 0 && activeRouteId === null) {
                    setActiveRouteId(data[0].id);
                }
                
                // Fetch stops for all routes
                data.forEach((r: any) => fetchStopsForRoute(r.id));
            }
        } catch(e) {}
    };

    const fetchStopsForRoute = async (routeId: number) => {
        try {
            const res = await fetch(`/api/shuttles/stops?routeId=${routeId}`);
            if(res.ok) {
                const data = await res.json();
                setStopsDict(prev => ({...prev, [routeId]: data.stops}));
            }
        } catch(e) {}
    };

    // Poll live shuttle locations every 5 seconds
    useEffect(() => {
        fetchSavedRoutes(); // 초기 DB 로드
        
        // Load global students
        fetch('/api/students')
            .then(res => res.json())
            .then(data => { if(Array.isArray(data)) setStudents(data); })
            .catch(e => console.error(e));

        const fetchLocations = async () => {
            try {
                const res = await fetch('/api/shuttles/location');
                const data = await res.json();
                if (data.routes) {
                    setLiveRoutes(data.routes.filter((r: any) => r.current_lat && r.current_lng));
                }
            } catch (err) {
                console.error("Failed to fetch live locations");
            }
        };

        fetchLocations();
        const interval = setInterval(fetchLocations, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSaveRoute = async () => {
        if(!formData.route_name) return alert('노선명을 입력해주세요.');
        setIsSaving(true);
        try {
            const res = await fetch('/api/shuttles/routes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if(res.ok) {
                const data = await res.json();
                setRoutes([...routes, data.route]);
                setIsModalOpen(false);
                setFormData({ route_name: '', driver_name: '', driver_phone: '', vehicle_number: '' });
                if(!activeRouteId) setActiveRouteId(data.route.id);
                setStopsDict(prev => ({...prev, [data.route.id]: []}));
            }
        } catch(e) {
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveStop = async () => {
        if(!stopFormData.stop_name || !stopFormData.arrival_time) return alert('입력값을 모두 채워주세요.');
        if(!activeRouteId) return;

        setIsSavingStop(true);
        try {
            const res = await fetch('/api/shuttles/stops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ route_id: activeRouteId, ...stopFormData })
            });
            if(res.ok) {
                const data = await res.json();
                setStopsDict(prev => ({
                    ...prev,
                    [activeRouteId]: [...(prev[activeRouteId] || []), data.stop]
                }));
                setIsStopModalOpen(false);
                setStopFormData({ stop_name: '', arrival_time: '' });
            } else {
                const err = await res.json();
                alert(err.error || '저장 오류');
            }
        } catch(e) {
            alert('저장 중 시스템 오류가 발생했습니다.');
        } finally {
            setIsSavingStop(false);
        }
    };

    const handleLocationUpdated = async (stopId: number, lat: number, lng: number) => {
        try {
            const res = await fetch('/api/shuttles/stops', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stop_id: stopId, lat, lng })
            });
            if(res.ok) {
                // 부드럽게 UI 갱신
                setStopsDict(prev => {
                    const newDict = {...prev};
                    for(const routeId in newDict) {
                        const idx = newDict[routeId].findIndex(s => s.id === stopId);
                        if(idx > -1) {
                            newDict[routeId][idx].lat = lat;
                            newDict[routeId][idx].lng = lng;
                        }
                    }
                    return newDict;
                });
                alert('📍 정류장 위치가 성공적으로 변경되었습니다!');
                setEditingLocationStopId(null);
            }
        } catch(e) {
            alert('위치 저장에 실패했습니다.');
        }
    };

    const openPassengerModal = async (stopId: number) => {
        setSelectedStopIdForPassenger(stopId);
        setIsPassengerModalOpen(true);
        try {
            const res = await fetch(`/api/shuttles/passengers?stopId=${stopId}`);
            if(res.ok) {
                const data = await res.json();
                setSelectedStudentIds(data.studentIds || []);
            }
        } catch(e) {}
    };

    const handleSavePassengers = async () => {
        if(!selectedStopIdForPassenger) return;
        setIsSavingPassengers(true);
        try {
            const res = await fetch('/api/shuttles/passengers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stop_id: selectedStopIdForPassenger, student_ids: selectedStudentIds })
            });
            if(res.ok) {
                setIsPassengerModalOpen(false);
                alert('탑승 명단이 성공적으로 저장되었습니다.');
                if (activeRouteId) fetchStopsForRoute(activeRouteId);
            }
        } catch(e) {
            alert('명단 저장에 실패했습니다.');
        } finally {
            setIsSavingPassengers(false);
        }
    };

    return (
        <div className="shuttles-container">
            {/* Modal Popup */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>🚌 새 차량 노선 추가</h2>
                        <div className="form-group">
                            <label>노선명 (필수)</label>
                            <input placeholder="예: 1호차 (하원)" value={formData.route_name} onChange={e => setFormData({...formData, route_name: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>차량 번호판</label>
                            <input placeholder="예: 12가 3456" value={formData.vehicle_number} onChange={e => setFormData({...formData, vehicle_number: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>기사님 성함</label>
                            <input placeholder="예: 김철수" value={formData.driver_name} onChange={e => setFormData({...formData, driver_name: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>기사님 연락처</label>
                            <input placeholder="예: 010-1234-5678" value={formData.driver_phone} onChange={e => setFormData({...formData, driver_phone: e.target.value})} />
                        </div>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>취소</button>
                            <button className="confirm-btn" disabled={isSaving} onClick={handleSaveRoute}>
                                {isSaving ? '저장 중...' : '저장하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stops Modal Popup */}
            {isStopModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>📌 새 정류장 추가</h2>
                        <p style={{fontSize:'0.85rem', color:'#64748b', marginBottom:'1.5rem'}}>
                            시간과 이름을 입력하면 추후 자동 알림 기능에서 활용됩니다.<br/>(좌표 지정 및 지도 수정 기능은 곧 추가됩니다.)
                        </p>
                        <div className="form-group">
                            <label>도착 예정 시간 (필수)</label>
                            <input type="time" placeholder="예: 08:30" value={stopFormData.arrival_time} onChange={e => setStopFormData({...stopFormData, arrival_time: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>정류장 명칭 (필수)</label>
                            <input placeholder="예: 래미안 파크빌 앞" value={stopFormData.stop_name} onChange={e => setStopFormData({...stopFormData, stop_name: e.target.value})} />
                        </div>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setIsStopModalOpen(false)}>취소</button>
                            <button className="confirm-btn" disabled={isSavingStop} onClick={handleSaveStop}>
                                {isSavingStop ? '저장 중...' : '저장하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Passenger Selection Modal */}
            {isPassengerModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{width:'500px'}}>
                        <h2>👪 탑승 관원 배정</h2>
                        <p style={{fontSize:'0.85rem', color:'#64748b', marginBottom:'1.5rem'}}>
                            이 정류장에서 승하차 할 관원들을 선택해주세요.
                        </p>
                        
                        <div className="student-list-scrollable" style={{maxHeight:'300px', overflowY:'auto', border:'1px solid #e2e8f0', borderRadius:'0.5rem', padding:'1rem', marginBottom:'1rem'}}>
                            {students.length === 0 ? (
                                <p style={{textAlign:'center', color:'#94a3b8'}}>등록된 관원이 없습니다.</p>
                            ) : (
                                students.map(s => (
                                    <label key={s.id} style={{display:'flex', alignItems:'center', padding:'0.5rem 0', borderBottom:'1px solid #f1f5f9', cursor:'pointer'}}>
                                        <input 
                                            type="checkbox" 
                                            style={{marginRight:'10px', transform:'scale(1.2)'}}
                                            checked={selectedStudentIds.includes(s.id)}
                                            onChange={(e) => {
                                                if(e.target.checked) setSelectedStudentIds([...selectedStudentIds, s.id]);
                                                else setSelectedStudentIds(selectedStudentIds.filter(id => id !== s.id));
                                            }}
                                        />
                                        <span style={{fontWeight:'500'}}>{s.name}</span>
                                        <span style={{color:'#64748b', marginLeft:'auto', fontSize:'0.85rem'}}>{s.className || '미분류'}</span>
                                    </label>
                                ))
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setIsPassengerModalOpen(false)}>닫기</button>
                            <button className="confirm-btn" disabled={isSavingPassengers} onClick={handleSavePassengers}>
                                {isSavingPassengers ? '저장 중...' : '명단 확정하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`layout-grid ${isMapOpen ? 'map-open' : ''}`}>
                {/* Left Panel: Routes & Stops List */}
                <div className="list-panel">
                    <div className="panel-header" style={{ display: 'flex', alignItems: 'center' }}>
                        <h2>운행 노선표</h2>
                        <button 
                            className="add-route-btn"
                            onClick={() => setIsModalOpen(true)}
                            title="새 노선 추가"
                        >
                            <Plus size={20} />
                        </button>
                        
                        <a 
                            href="/driver/shuttles" 
                            target="_blank" 
                            style={{
                                marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', 
                                background: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.4rem 0.8rem', 
                                borderRadius: '0.5rem', fontSize: '0.85rem', color: '#475569', 
                                textDecoration: 'none', fontWeight: 600, transition: 'all 0.2s'
                            }}
                        >
                            <Bus size={16} /> 기사용 앱(탑승 버튼) 열기
                        </a>
                    </div>
                    <div className="route-list">
                        {routes.length === 0 ? (
                            <div style={{textAlign:'center', color:'#94a3b8', padding: '2rem 0'}}>
                                등록된 노선이 없습니다.<br/>[새 노선 추가] 버튼을 눌러주세요.
                            </div>
                        ) : (
                            routes.map(r => (
                                <div key={r.id} className={`route-card ${activeRouteId === r.id ? 'active' : ''}`} onClick={() => setActiveRouteId(r.id)}>
                                    <div className="route-card-header">
                                        <h3>🚌 {r.route_name}</h3>
                                        <button className="icon-btn text-red"><Trash2 size={18} /></button>
                                    </div>
                                    <p className="driver-info">👨‍✈️ 기사님: {r.driver_name || '미지정'} ({r.driver_phone || '연락처 없음'})</p>
                                    {r.vehicle_number && <p className="driver-info" style={{marginTop:'-10px'}}>🏷️ 차량번호: {r.vehicle_number}</p>}
                                    
                                    <div className="stops-timeline">
                                        {(stopsDict[r.id] || []).map((stop: any) => (
                                            <div key={stop.id} className="stop-item">
                                                <div className="stop-time">{stop.arrival_time}</div>
                                                <div className="stop-marker"></div>
                                                <div className="stop-content">
                                                    <div>
                                                        <div className="stop-name">{stop.stop_name}</div>
                                                        <div style={{fontSize:'0.8rem', color:'#8b5cf6', marginTop:'4px', fontWeight:500}}>
                                                            {(() => {
                                                                let ps: any[] = [];
                                                                try { ps = typeof stop.passengers === 'string' ? JSON.parse(stop.passengers) : (stop.passengers || []); } catch(e) { ps = []; }
                                                                if (!Array.isArray(ps)) ps = [];
                                                                return ps.length > 0 ? `👩‍👦 ${ps.map((p: any) => p.name).join(', ')}` : <span style={{color:'#94a3b8'}}>탑승자 미지정</span>;
                                                            })()}
                                                        </div>
                                                    </div>
                                                    <div style={{display:'flex', gap:'5px', marginTop:'5px'}}>
                                                        <button 
                                                            className="text-secondary" 
                                                            onClick={(e) => { e.stopPropagation(); setEditingLocationStopId(editingLocationStopId === stop.id ? null : stop.id); }}
                                                            style={{background: editingLocationStopId === stop.id ? '#fef08a' : 'transparent', padding:'2px 4px', borderRadius:'4px'}}
                                                        >
                                                            <MapPin size={16} /> {editingLocationStopId === stop.id ? '수정 중 (지도 확인)' : '위치 수정'}
                                                        </button>
                                                        <button className="text-secondary" onClick={(e) => { e.stopPropagation(); openPassengerModal(stop.id); }}>
                                                            👨‍👩‍👧 명단 관리
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <button className="add-stop-btn" onClick={(e) => {
                                            e.stopPropagation(); // 카드 선택 이벤트를 막음
                                            if (activeRouteId !== r.id) setActiveRouteId(r.id);
                                            setIsStopModalOpen(true);
                                        }}>
                                            + 정류장 추가
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel: OpenStreetMap */}
                <div className="map-panel">
                    {editingLocationStopId && (
                        <div style={{
                            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                            background: '#ef4444', color: 'white', padding: '10px 20px', borderRadius: '30px',
                            fontWeight: 'bold', zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            pointerEvents: 'none', textAlign: 'center', width: '80%'
                        }}>
                            👇 지도를 움직여 중앙 📍핀에 위치를 맞춘 후 '확정' 버튼을 누르세요!
                        </div>
                    )}
                    <ShuttleMap 
                        liveRoutes={liveRoutes} 
                        activeStops={activeRouteId ? stopsDict[activeRouteId] : undefined}
                        editingLocationStopId={editingLocationStopId}
                        onLocationUpdated={handleLocationUpdated}
                    />
                </div>
            </div>

            <button 
                className="fab-map-btn" 
                onClick={() => setIsMapOpen(!isMapOpen)}
            >
                {isMapOpen ? '❌ 지도 닫기' : '🗺️ 지도 열기'}
            </button>

            <style jsx>{`
                .shuttles-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    height: calc(100vh - 4rem);
                }
                .add-route-btn {
                    background: #8b5cf6;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.4);
                    transition: all 0.2s;
                    margin-left: 0.75rem;
                }
                .add-route-btn:hover {
                    background: #7c3aed;
                    transform: scale(1.1);
                }
                
                .layout-grid {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    min-height: 0;
                }
                .list-panel {
                    background: white;
                    flex: 1;
                    transition: flex 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border-radius: 1rem;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .panel-header {
                    padding: 1.25rem;
                    border-bottom: 1px solid #e2e8f0;
                }
                .panel-header h2 { margin: 0; font-size: 1.125rem; font-weight: 600; }
                
                .route-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                    background: #f8fafc;
                }
                .route-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.75rem;
                    padding: 1.25rem;
                    margin-bottom: 1rem;
                }
                .route-card.active {
                    border-color: #8b5cf6;
                    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
                }
                .route-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }
                .route-card-header h3 { margin: 0; font-size: 1.1rem; color: #1e293b; }
                .driver-info { color: #64748b; font-size: 0.9rem; margin: 0 0 1.25rem 0; }
                
                .stops-timeline {
                    position: relative;
                    padding-left: 0.5rem;
                }
                .stops-timeline::before {
                    content: '';
                    position: absolute;
                    left: 2rem;
                    top: 0.5rem;
                    bottom: 2rem;
                    width: 2px;
                    background: #e2e8f0;
                }
                .stop-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    position: relative;
                    z-index: 1;
                }
                .stop-time {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #475569;
                    width: 40px;
                    padding-top: 2px;
                }
                .stop-marker {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: white;
                    border: 3px solid #8b5cf6;
                    margin-top: 4px;
                    z-index: 2;
                }
                .stop-content {
                    flex: 1;
                    background: #f8fafc;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .stop-name { font-weight: 600; color: #1e293b; word-break: break-all; }
                
                .icon-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; padding: 0.25rem; border-radius: 0.25rem; }
                .icon-btn:hover { background: #f1f5f9; }
                .text-red { color: #ef4444; }
                .text-secondary { 
                    color: #64748b; background: none; border: 1px solid #e2e8f0; 
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    gap: 0.25rem; font-size: 0.75rem; padding: 0.4rem; border-radius: 6px;
                    flex: 1; min-width: 0; white-space: nowrap; font-weight: 500;
                }
                .text-secondary:hover { background: #f8fafc; color: #1e293b; border-color: #cbd5e1; }
                
                .add-stop-btn {
                    margin-left: 2.5rem;
                    background: none;
                    border: 1px dashed #cbd5e1;
                    color: #64748b;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    width: calc(100% - 2.5rem);
                    cursor: pointer;
                    font-weight: 500;
                    transition: background 0.2s;
                }
                .add-stop-btn:hover { background: #f1f5f9; color: #475569; }

                /* Modal Specific Styles */
                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999;
                    display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px);
                }
                .modal-content {
                    background: white; width: 400px; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                }
                .modal-content h2 { margin: 0 0 1.5rem 0; font-size: 1.25rem; color: #1e293b; }
                .form-group { margin-bottom: 1rem; }
                .form-group label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 600; color: #475569; }
                .form-group input { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; outline: none; }
                .form-group input:focus { border-color: #8b5cf6; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem; }
                .cancel-btn, .confirm-btn { padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer; border: none; }
                .cancel-btn { background: #f1f5f9; color: #475569; }
                .cancel-btn:hover { background: #e2e8f0; }
                .confirm-btn { background: #8b5cf6; color: white; }
                .confirm-btn:hover { background: #7c3aed; }
                .confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .map-panel {
                    background: white;
                    border-radius: 1rem;
                    overflow: hidden;
                    position: relative;
                    height: 0;
                    min-height: 0;
                    border: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .layout-grid.map-open .list-panel {
                    display: none;
                }
                .layout-grid.map-open .map-panel {
                    height: 100%;
                    min-height: calc(100vh - 12rem);
                    border: 1px solid #e2e8f0;
                    margin-top: 0;
                    border-radius: 1rem;
                }
                .fab-map-btn {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    background: #1e293b;
                    color: white;
                    font-size: 1rem;
                    font-weight: 700;
                    padding: 1rem 1.5rem;
                    border-radius: 2rem;
                    border: none;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                    cursor: pointer;
                    z-index: 9000;
                    transition: transform 0.2s, background 0.2s;
                }
                .fab-map-btn:hover {
                    transform: scale(1.05);
                    background: #0f172a;
                }
                @media (max-width: 768px) {
                    .fab-map-btn {
                        bottom: 6rem; /* 하단 네비게이션을 피하기 위해 위치 상향 */
                        right: 1.5rem;
                        padding: 0.875rem 1.25rem;
                    }
                }
                .kakao-map {
                    width: 100%;
                    height: 100%;
                    background: #f1f5f9;
                }
                .map-loading-overlay {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.8);
                    color: #64748b;
                    font-weight: 500;
                }

            `}</style>
        </div>
    );
}
