"use client";

import { useEffect, useState } from 'react';
import { Plus, Trash2, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';

const ShuttleMap = dynamic(() => import('@/components/ShuttleMap'), {
    ssr: false,
    loading: () => <div className="map-loading-overlay"><span>오픈 지도를 불러오는 중입니다...</span></div>
});

export default function ShuttleManagerPage() {
    const [liveRoutes, setLiveRoutes] = useState<any[]>([]);
    
    // 새 노선 모달용 상태 (State)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [routes, setRoutes] = useState<any[]>([]);
    const [formData, setFormData] = useState({ route_name: '', driver_name: '', driver_phone: '', vehicle_number: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [activeRouteId, setActiveRouteId] = useState<number | null>(null);

    // Load saved database routes periodically (if needed, or just once)
    const fetchSavedRoutes = async () => {
        try {
            const res = await fetch('/api/shuttles/routes');
            if(res.ok) {
                const data = await res.json();
                setRoutes(data);
                if(data.length > 0 && activeRouteId === null) setActiveRouteId(data[0].id);
            }
        } catch(e) {}
    };

    // Poll live shuttle locations every 5 seconds
    useEffect(() => {
        fetchSavedRoutes(); // 초기 DB 로드
        
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
            }
        } catch(e) {
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
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

            <header className="page-header">
                <div>
                    <h1 className="page-title">차량 운행 관리 (안심 셔틀)</h1>
                    <p className="page-description">차량 노선을 설정하고 정류장을 등록하세요. (OpenStreetMap 무료 지도)</p>
                </div>
                <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} />
                    <span>새 노선 추가</span>
                </button>
            </header>

            <div className="layout-grid">
                {/* Left Panel: Routes & Stops List */}
                <div className="list-panel">
                    <div className="panel-header">
                        <h2>운행 노선표</h2>
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
                                        <button className="add-stop-btn">+ 정류장 추가</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel: OpenStreetMap */}
                <div className="map-panel">
                    <ShuttleMap liveRoutes={liveRoutes} />
                </div>
            </div>

            <style jsx>{`
                .shuttles-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    height: calc(100vh - 4rem);
                }
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .page-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0 0 0.25rem 0;
                }
                .page-description {
                    color: #64748b;
                    margin: 0;
                }
                .primary-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #8b5cf6;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.25rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .primary-btn:hover { background: #7c3aed; }
                
                .layout-grid {
                    display: grid;
                    grid-template-columns: 350px 1fr;
                    gap: 1.5rem;
                    flex: 1;
                    min-height: 0;
                }

                .list-panel {
                    background: white;
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
                    justify-content: space-between;
                    align-items: center;
                }
                .stop-name { font-weight: 600; color: #1e293b; }
                
                .icon-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; padding: 0.25rem; border-radius: 0.25rem; }
                .icon-btn:hover { background: #f1f5f9; }
                .text-red { color: #ef4444; }
                .text-secondary { color: #64748b; background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; font-size: 0.8rem;}
                
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
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    position: relative;
                    min-height: 500px;
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

                @media (max-width: 1024px) {
                    .layout-grid {
                        grid-template-columns: 1fr;
                        grid-template-rows: 50vh 50vh;
                    }
                }
            `}</style>
        </div>
    );
}
