"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarCheck, BarChart2, MessageCircle, Monitor, CreditCard } from "lucide-react";

export default function NavBar() {
    const pathname = usePathname();

    const navItems = [
        { name: "홈", path: "/", icon: <Home size={20} /> },
        { name: "출석부", path: "/attendance", icon: <CalendarCheck size={20} /> },
        { name: "수강료", path: "/tuition", icon: <CreditCard size={20} /> },
        { name: "알림", path: "/message", icon: <MessageCircle size={20} /> },
        { name: "키오스크", path: "/kiosk", icon: <Monitor size={20} /> },
    ];

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {navItems.map((item) => {
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
