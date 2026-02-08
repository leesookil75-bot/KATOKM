"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";

export default function InstallPrompt() {
    const [isInAppBrowser, setIsInAppBrowser] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Check if user agent is KakaoTalk or other in-app browsers
        const userAgent = navigator.userAgent.toLowerCase();
        const isKakao = userAgent.indexOf("kakao") > -1;
        const isLine = userAgent.indexOf("line") > -1;
        const isInstagram = userAgent.indexOf("instagram") > -1;

        // Also check if running as PWA (standalone)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        if ((isKakao || isLine || isInstagram) && !isStandalone) {
            setIsInAppBrowser(true);
        }
    }, []);

    if (!isInAppBrowser || !isVisible) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                color: "white",
                zIndex: 9999,
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                backdropFilter: "blur(4px)"
            }}
        >
            <div className="flex-center justify-between">
                <span className="font-bold flex-center gap-2">
                    <ExternalLink size={18} />
                    앱 설치를 위해 브라우저를 변경해주세요
                </span>
                <button onClick={() => setIsVisible(false)} className="text-gray-400">
                    <X size={20} />
                </button>
            </div>

            <p className="text-sm text-gray-200" style={{ lineHeight: "1.5" }}>
                카카오톡 인앱 브라우저에서는 홈 화면 추가가 제한됩니다.<br />
                우측 상단 <strong>메뉴(⋮)</strong> 버튼을 눌러<br />
                <span className="text-yellow-300 font-bold">다른 브라우저(Chrome/Safari)로 열기</span>를 선택해주세요.
            </p>
        </div>
    );
}
