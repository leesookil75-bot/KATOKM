"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, CalendarCheck, CreditCard, MessageCircle, Monitor, Settings, LogOut, LayoutDashboard, Home } from "lucide-react";

export default function AdminSidebar() {
    const pathname = usePathname();

    const menuItems = [
        { name: "홈", path: "/", icon: <Home size={22} color="#4f46e5" /> },
        { name: "학생 관리", path: "/students", icon: <Users size={22} color="#ec4899" /> },
        { name: "출석부", path: "/attendance", icon: <CalendarCheck size={22} color="#f59e0b" /> },
        { name: "수강료 관리", path: "/tuition", icon: <CreditCard size={22} color="#06b6d4" /> },
        { name: "알림 전송", path: "/message", icon: <MessageCircle size={22} color="#10b981" /> },
    ];

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    return (
        <aside className="pc-sidebar">
            <div className="sidebar-logo">
                <LayoutDashboard size={24} color="var(--primary)" />
                <span>AI-PASS 원장님</span>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link key={item.path} href={item.path} className={`sidebar-item ${isActive ? 'active' : ''}`}>
                            <div className="icon-wrapper">{item.icon}</div>
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
                    gap: 1.4rem;
                    padding: 1rem 1.25rem;
                    line-height: 1;
                    border-radius: 0.75rem;
                    color: #475569;
                    text-decoration: none;
                    font-size: 1.15rem;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                    transition: all 0.2s;
                }
                .icon-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
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
