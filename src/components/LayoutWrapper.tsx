"use client";

import { usePathname } from "next/navigation";
import NavBar from "./NavBar";
import AdminSidebar from "./AdminSidebar";
import { useEffect, useState } from "react";
import PullToRefresh from 'react-simple-pull-to-refresh';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isAuthPage, setIsAuthPage] = useState(false);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const authPages = ['/login', '/signup', '/admin-login'];
        setIsAuthPage(authPages.includes(pathname));

        // Fetch session to determine role
        async function checkSession() {
            try {
                const res = await fetch('/api/auth/session');
                if (res.ok) {
                    const session = await res.json();
                    setRole(session.user.role);
                } else {
                    setRole(null);
                }
            } catch (e) {
                console.error(e);
                setRole(null);
            }
        }
        checkSession();
    }, [pathname]);

    if (isAuthPage) {
        return <div className="auth-layout">{children}</div>;
    }

    // Explicitly hide for PARENT, STUDENT role or KIOSK page
    const isKioskPage = pathname === '/kiosk';
    const showNav = role !== 'PARENT' && role !== 'STUDENT' && !isKioskPage;

    return (
        <div className="app-layout">
            <div className="pc-view">
                {showNav && <AdminSidebar />}
                <main className="pc-content" style={!showNav ? { padding: 0 } : {}}>
                    {children}
                </main>
            </div>
            <div className="mobile-view">
                <PullToRefresh 
                    onRefresh={async () => {
                        window.location.reload();
                    }}
                    pullingContent={<div style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>아래로 당겨서 새로고침...</div>}
                    refreshingContent={<div style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>새로고침 중...</div>}
                >
                    <div className={`container ${isKioskPage ? 'kiosk-container' : ''}`} style={{ paddingBottom: showNav ? '80px' : '0', minHeight: '100vh' }}>
                        {children}
                    </div>
                </PullToRefresh>
                {showNav && <NavBar />}
            </div>

            <style jsx>{`
                .app-layout {
                    min-height: 100vh;
                }
                .pc-view {
                    display: none;
                }
                .mobile-view {
                    display: block;
                }

                @media (min-width: 1024px) {
                    .pc-view {
                        display: flex;
                        min-height: 100vh;
                    }
                    .mobile-view {
                        display: none;
                    }
                    .pc-content {
                        flex: 1;
                        padding: 2rem;
                        background: #f8fafc;
                        /* Joyride 호환성을 위해 개별 스크롤 대신 브라우저 기본 스크롤 사용 */
                    }
                }
            `}</style>
        </div>
    );
}
