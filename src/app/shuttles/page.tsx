"use client";

import { useEffect, useState } from 'react';
import { Plus, Trash2, MapPin } from 'lucide-react';
import { Map, useKakaoLoader } from "react-kakao-maps-sdk";

export default function ShuttleManagerPage() {
    const [loading, error] = useKakaoLoader({
        appkey: "0b341d186347a5bd2f2212bcd0cb0be1",
        libraries: ["clusterer", "services"],
    });

    return (
        <div className="shuttles-container">

            <header className="page-header">
                <div>
                    <h1 className="page-title">차량 운행 관리 (안심 셔틀)</h1>
                    <p className="page-description">차량 노선을 설정하고 정류장을 등록하세요. (카카오맵 API 연동 완료)</p>
                </div>
                <button className="primary-btn">
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
                        <div className="route-card active">
                            <div className="route-card-header">
                                <h3>🚌 1호차 (등원)</h3>
                                <button className="icon-btn text-red"><Trash2 size={18} /></button>
                            </div>
                            <p className="driver-info">👨‍✈️ 기사님: 김철수 (010-1234-5678)</p>
                            
                            <div className="stops-timeline">
                                <div className="stop-item">
                                    <div className="stop-time">08:30</div>
                                    <div className="stop-marker"></div>
                                    <div className="stop-content">
                                        <div className="stop-name">래미안 정문</div>
                                        <button className="text-secondary"><MapPin size={16} /> 위치 조정</button>
                                    </div>
                                </div>
                                <div className="stop-item">
                                    <div className="stop-time">08:45</div>
                                    <div className="stop-marker"></div>
                                    <div className="stop-content">
                                        <div className="stop-name">푸르지오 상가</div>
                                        <button className="text-secondary"><MapPin size={16} /> 위치 조정</button>
                                    </div>
                                </div>
                                <button className="add-stop-btn">+ 정류장 추가</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Kakao Map */}
                <div className="map-panel">
                    {loading ? (
                        <div className="map-loading-overlay">
                            <span>카카오맵을 불러오는 중입니다...</span>
                        </div>
                    ) : error ? (
                        <div className="map-loading-overlay">
                            <span>카카오맵 로드 실패 (API 키 또는 도메인을 확인하세요)</span>
                        </div>
                    ) : (
                        <Map
                            center={{ lat: 37.566826, lng: 126.9786567 }}
                            style={{ width: "100%", height: "100%" }}
                            level={3}
                            className="kakao-map"
                        />
                    )}
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

                .map-panel {
                    background: white;
                    border-radius: 1rem;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    position: relative;
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
