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
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "white",
                color: "black",
                zIndex: 999999,
                padding: "2rem",
                borderRadius: "1rem",
                boxShadow: "0 0 0 1000px rgba(0,0,0,0.7)", // Dim background
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
                width: "90%",
                maxWidth: "400px",
                textAlign: "center"
            }}
        >
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold" }}>앱 설치 안내</h2>
            <p>원활한 사용을 위해<br />앱을 설치해주세요.</p>

            <button
                onClick={handleInstallClick}
                style={{
                    backgroundColor: "#ef4444", // Red button
                    color: "white",
                    padding: "1rem 2rem",
                    borderRadius: "0.5rem",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    width: "100%"
                }}
            >
                홈화면 바로가기 설치
            </button>

            <button
                onClick={() => setIsVisible(false)}
                style={{ textDecoration: "underline", color: "#6b7280" }}
            >
                나중에 하기 (닫기)
            </button>
        </div>
    );
}
