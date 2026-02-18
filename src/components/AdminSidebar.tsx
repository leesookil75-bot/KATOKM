"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, CalendarCheck, CreditCard, MessageCircle, Monitor, Settings, LogOut, LayoutDashboard } from "lucide-react";

export default function AdminSidebar() {
    const pathname = usePathname();

    const menuItems = [
        { name: "홈", path: "/", icon: <LayoutDashboard size={20} color="var(--primary)" /> },
        { name: "학생 관리", path: "/students", icon: <Users size={20} color="var(--primary)" /> },
        { name: "출석부", path: "/attendance", icon: <CalendarCheck size={20} color="var(--primary)" /> },
        { name: "수강료 관리", path: "/tuition", icon: <CreditCard size={20} color="var(--primary)" /> },
        { name: "알림 전송", path: "/message", icon: <MessageCircle size={20} color="var(--primary)" /> },
        { name: "키오스크 모드", path: "/kiosk", icon: <Monitor size={20} color="var(--primary)" /> },
    ];

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    return (
        <aside className="pc-sidebar">
            <div className="sidebar-logo">
                <LayoutDashboard size={24} color="var(--primary)" />
                <span>출결 매니저 v2.0</span>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link key={item.path} href={item.path} className={`sidebar-item ${isActive ? 'active' : ''}`}>
                            {item.icon}
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={18} />
                    <span>로그아웃</span>
                </button>
            </div>

            <style jsx>{`
                .pc-sidebar {
                    width: 260px;
                    height: 100vh;
                    background: white;
                    border-right: 1px solid #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    padding: 1.5rem;
                    position: sticky;
                    top: 0;
                }
                .sidebar-logo {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 2.5rem;
                    padding-left: 0.5rem;
                }
                .sidebar-nav {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .sidebar-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    line-height: normal;
                    border-radius: 0.75rem;
                    color: #64748b;
                    text-decoration: none;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .sidebar-item:hover {
                    background: #f1f5f9;
                    color: #1e293b;
                }
                .sidebar-item.active {
                    background: #f1f5f9;
                    color: var(--primary);
                    font-weight: 600;
                }
                .sidebar-footer {
                    margin-top: auto;
                    padding-top: 1rem;
                    border-top: 1px solid #f1f5f9;
                }
                .logout-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    border-radius: 0.75rem;
                    color: #ef4444;
                    background: none;
                    border: none;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .logout-btn:hover {
                    background: #fef2f2;
                }
            `}</style>
        </aside>
    );
}
