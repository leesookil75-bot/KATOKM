"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, Download } from "lucide-react";

export default function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);
    const [isInAppBrowser, setIsInAppBrowser] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        const isKakao = userAgent.indexOf("kakao") > -1;
        const isLine = userAgent.indexOf("line") > -1;
        const isInstagram = userAgent.indexOf("instagram") > -1;
        const isInApp = isKakao || isLine || isInstagram;

        // Detect OS
        const android = /android/i.test(userAgent);
        const ios = /iphone|ipad|ipod/i.test(userAgent);

        setIsAndroid(android);
        setIsIOS(ios);

        // Also check if running as PWA (standalone)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        if (isInApp && !isStandalone) {
            setIsInAppBrowser(true);
        }
    }, []);

    const handleInstallClick = () => {
        if (isAndroid) {
            // Android: Try to open in Chrome via Intent
            // This url scheme forces Android to open the link in a browser app (preferably Chrome)
            const url = window.location.href.replace(/^https?:\/\//, '');
            const intentUrl = `intent://${url}#Intent;scheme=https;package=com.android.chrome;end`;
            window.location.href = intentUrl;
        } else {
            // iOS or others: Show alert instruction
            alert("아이폰에서는 우측 상단 메뉴(⋮) 또는 하단 공유(⬆) 버튼을 눌러 'Safari로 열기'를 선택해주세요.");
        }
    };

    if (!isInAppBrowser || !isVisible) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: "#111827", // Dark background like screenshot
                color: "white",
                zIndex: 9999,
                padding: "0.75rem 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
        >
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <button
                    onClick={handleInstallClick}
                    className="flex-center gap-2"
                    style={{
                        backgroundColor: "#374151", // Dark gray button
                        border: "1px solid #4b5563",
                        borderRadius: "9999px",
                        padding: "0.5rem 1.25rem",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        color: "white",
                        whiteSpace: "nowrap"
                    }}
                >
                    홈화면 바로가기 설치
                </button>
            </div>

            <button
                onClick={() => setIsVisible(false)}
                style={{ color: "#9ca3af", padding: "0.25rem", position: "absolute", right: "1rem" }}
            >
                <X size={20} />
            </button>
        </div>
    );
}
