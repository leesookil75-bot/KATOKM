"use client";

import { usePathname } from "next/navigation";
import NavBar from "./NavBar";
import AdminSidebar from "./AdminSidebar";
import { useEffect, useState } from "react";

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

    // Explicitly hide for PARENT role or KIOSK page
    const isKioskPage = pathname === '/kiosk';
    const showNav = role !== 'PARENT' && !isKioskPage;

    return (
        <div className="app-layout">
            <div className="pc-view">
                {showNav && <AdminSidebar />}
                <main className="pc-content" style={!showNav ? { padding: 0 } : {}}>
                    {children}
                </main>
            </div>
            <div className="mobile-view">
                <div className={`container ${isKioskPage ? 'kiosk-container' : ''}`} style={{ paddingBottom: showNav ? '80px' : '0' }}>
                    {children}
                </div>
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
