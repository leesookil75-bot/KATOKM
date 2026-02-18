"use client";

import { usePathname } from "next/navigation";
import NavBar from "./NavBar";
import AdminSidebar from "./AdminSidebar";
import { useEffect, useState } from "react";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isAuthPage, setIsAuthPage] = useState(false);

    useEffect(() => {
        const authPages = ['/login', '/signup', '/super-admin', '/parent/login'];
        setIsAuthPage(authPages.includes(pathname));
    }, [pathname]);

    if (isAuthPage) {
        return <div className="auth-layout">{children}</div>;
    }

    return (
        <div className="app-layout">
            <div className="pc-view">
                <AdminSidebar />
                <main className="pc-content">
                    {children}
                </main>
            </div>
            <div className="mobile-view">
                <div className="container" style={{ paddingBottom: '80px' }}>
                    {children}
                </div>
                <NavBar />
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
                        overflow-y: auto;
                        max-height: 100vh;
                    }
                }
            `}</style>
        </div>
    );
}
