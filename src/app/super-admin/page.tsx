"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, CheckCircle, XCircle, Clock, School, User, Phone, MapPin } from "lucide-react";

interface Academy {
    id: string;
    username: string;
    academy_name: string;
    admin_name: string;
    phone: string;
    address: string;
    status: 'PENDING' | 'APPROVED';
    created_at: string;
    password?: string;
}

export default function SuperAdminPage() {
    const [academies, setAcademies] = useState<Academy[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchAcademies = async () => {
        try {
            const res = await fetch('/api/admin/academies');
            if (res.ok) {
                const data = await res.json();
                setAcademies(data);
            } else {
                router.push('/login');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAcademies();
    }, []);

    const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        if (!confirm(`${status === 'APPROVED' ? '승인' : '거절/삭제'}하시겠습니까?`)) return;

        try {
            const res = await fetch('/api/admin/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });

            if (res.ok) {
                fetchAcademies();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const [editingAcademy, setEditingAcademy] = useState<Academy | null>(null);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAcademy) return;

        try {
            const res = await fetch('/api/admin/academies/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingAcademy)
            });

            if (res.ok) {
                setEditingAcademy(null);
                fetchAcademies();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <main className="super-container">
            <header className="super-header">
                <div className="header-left">
                    <ShieldCheck size={32} color="var(--primary)" />
                    <h1>슈퍼관리자 대시보드</h1>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary">로그아웃</button>
            </header>

            <div className="stats-row">
                <div className="stat-card">
                    <h3>전체 학원</h3>
                    <p className="stat-value">{academies.length}</p>
                </div>
                <div className="stat-card pending">
                    <h3>승인 대기</h3>
                    <p className="stat-value">{academies.filter(a => a.status === 'PENDING').length}</p>
                </div>
            </div>

            <section className="academy-section">
                <h2 className="section-title">학원 관리 리스트</h2>
                <div className="table-wrapper">
                    <table className="super-table">
                        <thead>
                            <tr>
                                <th>학원 정보</th>
                                <th>관리자 정보</th>
                                <th>주소</th>
                                <th>상태</th>
                                <th>액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            {academies.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="empty-row">신청 내역이 없습니다.</td>
                                </tr>
                            ) : (
                                academies.map(academy => (
                                    <tr key={academy.id}>
                                        <td>
                                            <div className="academy-info">
                                                <School size={16} />
                                                <strong>{academy.academy_name}</strong>
                                                <span className="username">(@{academy.username})</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="admin-info">
                                                <div className="info-item"><User size={14} /> {academy.admin_name}</div>
                                                <div className="info-item"><Phone size={14} /> {academy.phone}</div>
                                            </div>
                                        </td>
                                        <td className="address-cell">
                                            <div className="info-item"><MapPin size={14} /> {academy.address}</div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${academy.status.toLowerCase()}`}>
                                                {academy.status === 'PENDING' ? <Clock size={12} /> : <CheckCircle size={12} />}
                                                {academy.status === 'PENDING' ? '대기' : '승인됨'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                {academy.status === 'PENDING' && (
                                                    <button onClick={() => handleAction(academy.id, 'APPROVED')} className="btn-approve">승인</button>
                                                )}
                                                <button onClick={() => setEditingAcademy(academy)} className="btn-edit">수정</button>
                                                <button onClick={() => handleAction(academy.id, 'REJECTED')} className="btn-reject">삭제</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Edit Modal */}
            {editingAcademy && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>학원 정보 수정</h3>
                        <form onSubmit={handleUpdate} className="edit-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>학원 이름</label>
                                    <input value={editingAcademy.academy_name} onChange={e => setEditingAcademy({ ...editingAcademy, academy_name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>관리자 이름</label>
                                    <input value={editingAcademy.admin_name} onChange={e => setEditingAcademy({ ...editingAcademy, admin_name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>아이디</label>
                                    <input value={editingAcademy.username} onChange={e => setEditingAcademy({ ...editingAcademy, username: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>비밀번호</label>
                                    <input value={editingAcademy.password || ''} onChange={e => setEditingAcademy({ ...editingAcademy, password: e.target.value })} placeholder="비밀번호 변경" />
                                </div>
                                <div className="form-group full-width">
                                    <label>연락처</label>
                                    <input value={editingAcademy.phone} onChange={e => setEditingAcademy({ ...editingAcademy, phone: e.target.value })} required />
                                </div>
                                <div className="form-group full-width">
                                    <label>주소</label>
                                    <textarea value={editingAcademy.address} onChange={e => setEditingAcademy({ ...editingAcademy, address: e.target.value })} required />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setEditingAcademy(null)} className="btn-cancel">취소</button>
                                <button type="submit" className="btn-save">저장하기</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .super-container {
                    padding: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .super-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .header-left h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                }
                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                .stat-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 1rem;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                    border: 1px solid #e2e8f0;
                }
                .stat-card h3 {
                    font-size: 0.875rem;
                    color: #64748b;
                    margin-bottom: 0.5rem;
                }
                .stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #1e293b;
                }
                .stat-card.pending {
                    border-left: 4px solid #f59e0b;
                }
                .academy-section {
                    background: white;
                    border-radius: 1rem;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                }
                .section-title {
                    padding: 1.5rem;
                    font-size: 1.125rem;
                    font-weight: 600;
                    border-bottom: 1px solid #f1f5f9;
                }
                .table-wrapper {
                    overflow-x: auto;
                }
                .super-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .super-table th {
                    text-align: left;
                    padding: 1rem 1.5rem;
                    background: #f8fafc;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                }
                .super-table td {
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid #f1f5f9;
                    font-size: 0.875rem;
                }
                .academy-info {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .username {
                    color: #94a3b8;
                    font-size: 0.75rem;
                }
                .admin-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .info-item {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    color: #475569;
                }
                .address-cell {
                    max-width: 250px;
                }
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.25rem 0.625rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .status-badge.pending {
                    background: #fef3c7;
                    color: #d97706;
                }
                .status-badge.approved {
                    background: #dcfce7;
                    color: #16a34a;
                }
                .action-btns {
                    display: flex;
                    gap: 0.5rem;
                }
                .action-btns button {
                    padding: 0.375rem 0.75rem;
                    border-radius: 0.5rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-approve {
                    background: var(--primary);
                    color: white;
                    border: none;
                }
                .btn-approve:hover { background: #4338ca; }
                .btn-edit {
                    background: #f1f5f9;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                }
                .btn-edit:hover { background: #e2e8f0; }
                .btn-reject {
                    background: #fee2e2;
                    color: #dc2626;
                    border: 1px solid #fecaca;
                }
                .btn-reject:hover { background: #fecaca; }
                .empty-row {
                    text-align: center;
                    color: #94a3b8;
                    padding: 4rem !important;
                }
                
                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }
                .modal-card {
                    background: white;
                    padding: 2rem;
                    border-radius: 1.5rem;
                    width: 90%;
                    max-width: 600px;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                }
                .modal-card h3 {
                    margin-bottom: 1.5rem;
                    font-size: 1.25rem;
                    font-weight: 700;
                }
                .edit-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }
                .full-width { grid-column: span 2; }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                .form-group label {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                }
                .form-group input, .form-group textarea {
                    padding: 0.75rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.75rem;
                    font-size: 0.875rem;
                }
                .form-group textarea { height: 80px; resize: none; }
                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    margin-top: 1rem;
                }
                .btn-cancel {
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.75rem;
                    background: #f1f5f9;
                    border: none;
                    color: #475569;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-save {
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.75rem;
                    background: var(--primary);
                    border: none;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                }
            `}</style>
        </main>
    );
}
