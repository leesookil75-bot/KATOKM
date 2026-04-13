"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, CalendarCheck, MessageCircle, Monitor, CreditCard, LogOut, Bus } from "lucide-react";

export default function NavBar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        if (!confirm("로그아웃 하시겠습니까?")) return;
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    const navItems = [
        { name: "홈", path: "/", icon: <Home size={20} /> },
        { name: "출석부", path: "/attendance", icon: <CalendarCheck size={20} /> },
        { name: "수강료", path: "/tuition", icon: <CreditCard size={20} /> },
        { name: "알림", path: "/message", icon: <MessageCircle size={20} /> },
        { name: "셔틀", path: "/shuttles", icon: <Bus size={20} /> },
        { name: "키오스크", path: "/kiosk", icon: <Monitor size={20} /> },
        { name: "로그아웃", path: "logout", icon: <LogOut size={20} />, action: handleLogout },
    ];

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {navItems.map((item) => {
                    if (item.path === "logout") {
                        return (
                            <button
                                key={item.path}
                                onClick={item.action}
                                className="nav-item logout-btn-mobile"
                                style={{ background: 'none', border: 'none', padding: 0 }}
                            >
                                <div className="icon">{item.icon}</div>
                                <span className="label">{item.name}</span>
                            </button>
                        );
                    }
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`nav-item ${isActive ? "active" : ""}`}
                        >
                            <div className="icon">{item.icon}</div>
                            <span className="label">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
