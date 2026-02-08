"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, Download } from "lucide-react";

export default function InstallPrompt() {
    const [isVisible, setIsVisible] = useState(true);
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();

        // Detect OS
        const android = /android/i.test(userAgent);
        const ios = /iphone|ipad|ipod/i.test(userAgent);

        setIsAndroid(android);
        setIsIOS(ios);

        // If NOT mobile, hide it. (Show by default on mobile)
        if (!android && !ios) {
            setIsVisible(false);
        }

        // If already installed (standalone), hide it
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        if (isStandalone) {
            setIsVisible(false);
        }

    }, []);

    const handleInstallClick = () => {
        if (isAndroid) {
            // Android Intent to open in Chrome
            const url = window.location.href.replace(/^https?:\/\//, '');
            const intentUrl = `intent://${url}#Intent;scheme=https;package=com.android.chrome;end`;
            window.location.href = intentUrl;
        } else {
            // iOS / Others
            alert("아이폰: 하단 '공유' 버튼 -> 'Safari로 열기' -> '홈 화면에 추가'를 해주세요.");
        }
    };

    if (!isVisible) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: "#111827",
                color: "white",
                zIndex: 99999, // Super high z-index
                padding: "0.8rem 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
        >
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <button
                    onClick={handleInstallClick}
                    className="flex-center gap-2"
                    style={{
                        backgroundColor: "#374151",
                        border: "1px solid #6b7280",
                        borderRadius: "9999px",
                        padding: "0.5rem 1.2rem",
                        fontSize: "0.95rem",
                        fontWeight: "bold",
                        color: "white",
                        whiteSpace: "nowrap"
                    }}
                >
                    <Download size={16} />
                    홈화면 바로가기 설치
                </button>
            </div>

            <button
                onClick={() => setIsVisible(false)}
                style={{ color: "#9ca3af", padding: "0.5rem", position: "absolute", right: "0.5rem" }}
            >
                <X size={24} />
            </button>
        </div>
    );
}
