"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, Lock, ChevronRight, ShieldCheck, RefreshCw } from "lucide-react";
import { auth } from "@/lib/firebase/clientApp";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
  const grecaptcha: any;
}

export default function LoginPage() {
    const [phone, setPhone] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showSplash, setShowSplash] = useState(true);
    
    // OTP states
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    const router = useRouter();

    useEffect(() => {
        // App launch splash screen
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 1500); // 1.5 seconds splash
        return () => clearTimeout(timer);
    }, []);

    // Initialize Recaptcha
    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
            });
        }
    };

    const formatPhoneNumber = (phoneNumber: string) => {
        // Remove all non-numeric characters
        const cleaned = phoneNumber.replace(/[^0-9]/g, '');
        // For South Korea, assuming number starts with 010
        if (cleaned.startsWith('0')) {
            return '+82' + cleaned.substring(1);
        }
        return '+' + cleaned;
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone) {
            setError("전화번호를 입력해주세요.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            setupRecaptcha();
            const appVerifier = window.recaptchaVerifier;
            const formattedPhone = formatPhoneNumber(phone);
            
            const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(result);
            setIsOtpSent(true);
        } catch (err: any) {
            console.error("SMS 전송 오류:", err);
            
            // Firebase 상세 에러 메시지 추출
            let errorMsg = "인증번호 발송에 실패했습니다. 번호를 확인해주세요.";
            if (err.code === 'auth/unauthorized-domain') {
                errorMsg = "개발 환경(도메인)이 Firebase 콘솔에 등록되지 않았습니다.";
            } else if (err.code === 'auth/too-many-requests') {
                errorMsg = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
            } else if (err.message) {
                errorMsg = `발송 실패: ${err.message}`;
            }

            setError(errorMsg);
            
            // Reset recaptcha if error
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.render().then((widgetId: any) => {
                    grecaptcha.reset(widgetId);
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verificationCode || !confirmationResult) return;

        setLoading(true);
        setError("");

        try {
            // 1. Verify code with Firebase
            const result = await confirmationResult.confirm(verificationCode);
            const user = result.user;
            
            // 2. Get ID Token
            const idToken = await user.getIdToken();

            // 3. Send to our backend to verify and issue session
            const res = await fetch("/api/parent/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.role === 'STUDENT') {
                    router.push("/student");
                } else {
                    router.push("/parent");
                }
            } else {
                const data = await res.json();
                setError(data.error || "학원 시스템에 등록되지 않은 번호입니다.");
                // Sign out of firebase to allow retry
                await auth.signOut();
            }
        } catch (err: any) {
            console.error("인증 오류:", err);
            setError("인증번호가 일치하지 않습니다.");
        } finally {
            setLoading(false);
        }
    };

    if (showSplash) {
        return (
            <div className="splash-screen">
                <div className="logo-container">
                    <img src="/icon.png" alt="AI-PASS 로고" className="app-logo" />
                </div>
                <style jsx>{`
                    .splash-screen {
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: #fdfbf7;
                    }
                    .logo-container {
                        width: 100px;
                        height: 100px;
                        border-radius: 1.5rem;
                        overflow: hidden;
                        box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
                        background: #fff7e6;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        animation: pulse 2s infinite ease-in-out;
                    }
                    .app-logo {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                    @keyframes pulse {
                        0% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.05); opacity: 0.8; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-container">
                        <img src="/icon.png" alt="AI-PASS 로고" className="app-logo" />
                    </div>
                    <h1>AI-PASS</h1>
                    <p>자녀의 출결 및 현황을 확인하세요</p>
                </div>

                {!isOtpSent ? (
                    <form onSubmit={handleSendOtp} className="login-form">
                        <div className="input-group">
                            <label>휴대폰 번호 인증</label>
                            <div className="input-wrapper">
                                <Phone size={20} className="icon" />
                                <input
                                    type="tel"
                                    placeholder="010-1234-5678"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && <p className="error-message">{error}</p>}

                        <div id="recaptcha-container"></div>

                        <button type="submit" className="login-button" disabled={loading || !phone}>
                            {loading ? "전송 중..." : "인증번호 받기"}
                            {!loading && <ChevronRight size={20} />}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="login-form otp-form">
                        <div className="otp-banner">
                            <ShieldCheck size={40} color="#10b981" />
                            <h3>인증번호 발송 완료</h3>
                            <p>{phone} 번호로 전송된<br/>6자리 코드를 입력해주세요.</p>
                        </div>

                        <div className="input-group">
                            <div className="input-wrapper">
                                <Lock size={20} className="icon" />
                                <input
                                    type="number"
                                    placeholder="인증번호 6자리"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>

                        {error && <p className="error-message">{error}</p>}

                        <button type="submit" className="login-button verify-button" disabled={loading || verificationCode.length < 6}>
                            {loading ? "학인 중..." : "인증 확인 및 로그인"}
                            {!loading && <ChevronRight size={20} />}
                        </button>

                        <button 
                            type="button" 
                            className="text-button"
                            onClick={() => {
                                setIsOtpSent(false);
                                setVerificationCode("");
                                setError("");
                            }}
                            disabled={loading}
                        >
                            <RefreshCw size={16} /> 번호 다시 입력하기
                        </button>
                    </form>
                )}

                <div className="login-footer">
                    <p>학원 시스템에 등록된 번호만<br/><span>로그인이 가능합니다.</span></p>
                    
                    <div className="parent-link-box">
                        <Link href="/admin-login" className="admin-login-link">
                            <ShieldCheck size={18} style={{ marginRight: '6px' }} />
                            원장님(관리자) 로그인 가기
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recaptcha Global Type fixes below */}
            <style jsx global>{`
                .grecaptcha-badge { visibility: hidden; }
            `}</style>

            <style jsx>{`
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #fdfbf7;
                    padding: 1.5rem;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .login-card {
                    width: 100%;
                    max-width: 400px;
                    background: white;
                    border-radius: 2rem;
                    padding: 2.5rem 2rem;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
                    border: 1px solid #f1f5f9;
                }
                .login-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }
                .logo-container {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 1.25rem;
                    border-radius: 1.5rem;
                    overflow: hidden;
                    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
                    background: #fff7e6;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .app-logo {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .login-header h1 {
                    font-size: 1.85rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                    letter-spacing: -0.025em;
                }
                .login-header p {
                    color: #64748b;
                    font-size: 0.95rem;
                }
                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .otp-form {
                    animation: slideUp 0.3s ease-out;
                }
                .otp-banner {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    background: #f0fdf4;
                    padding: 1.5rem;
                    border-radius: 1.5rem;
                    margin-bottom: 0.5rem;
                }
                .otp-banner h3 {
                    margin: 0.75rem 0 0.25rem;
                    color: #166534;
                    font-size: 1.1rem;
                    font-weight: 700;
                }
                .otp-banner p {
                    color: #15803d;
                    font-size: 0.9rem;
                    line-height: 1.4;
                    margin: 0;
                }
                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .input-group label {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #475569;
                    margin-left: 0.25rem;
                }
                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .input-wrapper .icon {
                    position: absolute;
                    left: 1rem;
                    color: #94a3b8;
                }
                .input-wrapper input {
                    width: 100%;
                    padding: 0.875rem 1rem 0.875rem 3rem;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 1rem;
                    font-size: 1rem;
                    transition: all 0.2s;
                    background: #f8fafc;
                    color: #1e293b;
                }
                .input-wrapper input:focus {
                    outline: none;
                    border-color: #ff9800;
                    background: white;
                    box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.1);
                }
                
                /* Hide number input spinners */
                .input-wrapper input[type="number"]::-webkit-inner-spin-button,
                .input-wrapper input[type="number"]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                
                .login-button {
                    margin-top: 0.5rem;
                    background: #ff9800;
                    color: white;
                    padding: 1rem;
                    border-radius: 1rem;
                    font-size: 1.1rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                    box-shadow: 0 4px 10px -1px rgba(255, 152, 0, 0.3);
                    border: none;
                    cursor: pointer;
                }
                .verify-button {
                    background: #10b981;
                    box-shadow: 0 4px 10px -1px rgba(16, 185, 129, 0.3);
                }
                .verify-button:hover:not(:disabled) {
                    background: #059669;
                    box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);
                }
                .login-button:hover:not(:disabled) {
                    background: #f57c00;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(255, 152, 0, 0.4);
                }
                .login-button:active:not(:disabled) {
                    transform: translateY(0);
                }
                .login-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .text-button {
                    background: none;
                    border: none;
                    color: #64748b;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.3rem;
                    margin-top: 0.5rem;
                    cursor: pointer;
                    padding: 0.5rem;
                }
                .text-button:hover {
                    color: #1e293b;
                }
                .error-message {
                    color: #ef4444;
                    font-size: 0.875rem;
                    text-align: center;
                    font-weight: 600;
                    animation: shake 0.4s ease-in-out;
                }
                .login-footer {
                    margin-top: 2rem;
                    text-align: center;
                }
                .login-footer p {
                    font-size: 0.875rem;
                    color: #64748b;
                    line-height: 1.5;
                }
                .login-footer span {
                    font-size: 0.8rem;
                    color: #94a3b8;
                }
                
                @keyframes slideUp {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .admin-login-link {
                    color: #64748b;
                    font-size: 0.9rem;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    padding: 0.5rem 1rem;
                    border-radius: 99px;
                    transition: all 0.2s;
                    border: 1px solid #cbd5e1;
                }
                .admin-login-link:hover {
                    background: #f1f5f9;
                    color: #334155;
                }
            `}</style>
        </div>
    );
}
