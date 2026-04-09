"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, ArrowLeft, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/firebase/clientApp";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
  const grecaptcha: any;
}

export default function SignupPage() {
    const [formData, setFormData] = useState({
        academyName: "",
        adminName: "",
        phone: "",
        address: "",
        username: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // OTP states
    const [verificationCode, setVerificationCode] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [idToken, setIdToken] = useState("");
    const [otpLoading, setOtpLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'signup-recaptcha-container', {
                'size': 'invisible',
            });
        }
    };

    const formatPhoneNumber = (phoneNumber: string) => {
        const cleaned = phoneNumber.replace(/[^0-9]/g, '');
        if (cleaned.startsWith('0')) return '+82' + cleaned.substring(1);
        return '+' + cleaned;
    };

    const handleSendOtp = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!formData.phone) {
            setError("전화번호를 입력해주세요.");
            return;
        }

        setOtpLoading(true);
        setError("");

        try {
            setupRecaptcha();
            const appVerifier = window.recaptchaVerifier;
            const formattedPhone = formatPhoneNumber(formData.phone);
            
            const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(result);
            setIsOtpSent(true);
        } catch (err: any) {
            console.error("SMS 전송 오류:", err);
            setError("인증번호 발송에 실패했습니다. 번호를 확인해주세요.");
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.render().then((widgetId: any) => {
                    grecaptcha.reset(widgetId);
                });
            }
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!verificationCode || !confirmationResult) return;

        setOtpLoading(true);
        setError("");

        try {
            const result = await confirmationResult.confirm(verificationCode);
            const user = result.user;
            const token = await user.getIdToken();
            setIdToken(token);
            setIsPhoneVerified(true);
            setIsOtpSent(false); 
            setError("");
        } catch (err: any) {
            console.error("인증 오류:", err);
            setError("인증번호가 일치하지 않습니다.");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isPhoneVerified || !idToken) {
            setError("휴대폰 번호를 먼저 인증해주세요.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, idToken }),
            });

            const data = await res.json();

            if (res.ok) {
                setIsSuccess(true);
                await auth.signOut(); // Clean up firebase state after signup
            } else {
                const isMissingTable = data.details?.includes("relation") || data.details?.includes("does not exist");
                setError(
                    isMissingTable
                        ? "데이터베이스 초기화가 필요합니다. 먼저 아래 링크를 클릭하여 초기화한 후 다시 시도해주세요."
                        : (data.details ? `${data.error}\n(${data.details})` : (data.error || "회원가입에 실패했습니다."))
                );
            }
        } catch (err) {
            setError("서버와의 통신에 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <main className="auth-container">
                <div className="auth-card success-card">
                    <div className="auth-header">
                        <div className="success-icon">
                            <CheckCircle2 size={64} color="#10b981" />
                        </div>
                        <h1>회원가입 신청 완료</h1>
                        <p>슈퍼관리자의 승인 후 AI-PASS를 사용할 수 있습니다.</p>
                    </div>
                    <button onClick={() => router.push("/login")} className="btn btn-primary auth-btn">
                        로그인 화면으로 이동
                    </button>
                </div>
                <style jsx>{`
            .auth-container {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: calc(100vh - 100px);
                padding: 1rem;
                background: #f8fafc;
              }
              .auth-card {
                background: white;
                padding: 2.5rem;
                border-radius: 1.5rem;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                width: 100%;
                max-width: 500px;
                border: 1px solid #e2e8f0;
              }
              .success-card {
                  text-align: center;
              }
              .success-icon {
                  margin-bottom: 1.5rem;
                  display: flex;
                  justify-content: center;
              }
              .auth-header h1 {
                font-size: 1.5rem;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 1rem;
              }
              .auth-header p {
                color: #64748b;
                margin-bottom: 2rem;
              }
              .auth-btn {
                width: 100%;
                padding: 0.875rem;
                font-size: 1rem;
                font-weight: 600;
              }
        `}</style>
            </main>
        );
    }

    return (
        <main className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <Link href="/login" className="back-link">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1>학원 관리자 회원가입</h1>
                    <p>AI-PASS 원장님 시작하기</p>
                </div>

                <form onSubmit={handleSignup} className="auth-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>학원 이름</label>
                            <input name="academyName" value={formData.academyName} onChange={handleChange} placeholder="학원명을 입력하세요" required />
                        </div>
                        <div className="form-group">
                            <label>관리자 이름</label>
                            <input name="adminName" value={formData.adminName} onChange={handleChange} placeholder="이름을 입력하세요" required />
                        </div>

                        <div className="form-group full-width">
                            <label>연락처 본인인증</label>
                            <div className="phone-verify-container">
                                <input 
                                    name="phone" 
                                    type="tel"
                                    value={formData.phone} 
                                    onChange={handleChange} 
                                    placeholder="010-0000-0000" 
                                    required 
                                    disabled={isPhoneVerified}
                                    style={isPhoneVerified ? { background: '#f0fdf4', borderColor: '#86efac' } : {}}
                                />
                                {!isPhoneVerified && (
                                    <button 
                                        type="button" 
                                        className="verify-btn" 
                                        onClick={handleSendOtp}
                                        disabled={otpLoading || !formData.phone}
                                    >
                                        {otpLoading ? "전송중..." : (isOtpSent ? "재전송" : "인증번호")}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* OTP Input section */}
                        {isOtpSent && !isPhoneVerified && (
                            <div className="form-group full-width otp-group">
                                <label>인증번호 입력</label>
                                <div className="phone-verify-container">
                                    <input 
                                        type="number" 
                                        value={verificationCode} 
                                        onChange={(e) => setVerificationCode(e.target.value)} 
                                        placeholder="6자리 코드 입력" 
                                    />
                                    <button 
                                        type="button" 
                                        className="verify-btn verify-confirm-btn" 
                                        onClick={handleVerifyOtp}
                                        disabled={otpLoading || verificationCode.length < 6}
                                    >
                                        확인
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {isPhoneVerified && (
                            <div className="full-width verification-success">
                                <CheckCircle2 size={16} color="#10b981" />
                                <span>휴대폰 본인인증이 완료되었습니다.</span>
                            </div>
                        )}

                        {/* Invisible recaptcha */}
                        <div id="signup-recaptcha-container"></div>

                        <div className="form-group">
                            <label>아이디</label>
                            <input name="username" value={formData.username} onChange={handleChange} placeholder="아이디를 정해주세요" required />
                        </div>
                        <div className="form-group">
                            <label>비밀번호</label>
                            <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="비밀번호" required />
                        </div>
                        <div className="form-group full-width">
                            <label>학원 주소</label>
                            <textarea name="address" value={formData.address} onChange={handleChange} placeholder="학원 주소를 상세히 입력해주세요" required rows={2} />
                        </div>
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                            {(error.includes("데이터베이스 초기화") || error.includes("relation")) && (
                                <div style={{ marginTop: "0.5rem" }}>
                                    <Link href="/api/seed" target="_blank" className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
                                        데이터베이스 초기화 실행하기
                                    </Link>
                                    <p className="text-xs" style={{ marginTop: "0.4rem", opacity: 0.8 }}>
                                        *클릭 후 'Database schema updated' 메시지가 나오면 다시 가입을 시도해주세요.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary auth-btn" disabled={isLoading || !isPhoneVerified}>
                        {isLoading ? "가입 신청 중..." : (!isPhoneVerified ? "본인인증을 먼저 진행해주세요" : "회원가입 신청")}
                        {(!isLoading && isPhoneVerified) && <UserPlus size={18} style={{ marginLeft: "8px" }} />}
                    </button>
                </form>
            </div>

            <style jsx global>{`
                .grecaptcha-badge { visibility: hidden; }
            `}</style>

            <style jsx>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 100px);
          padding: 2rem 1rem;
          background: #f8fafc;
        }
        .auth-card {
          background: white;
          padding: 2.5rem;
          border-radius: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          width: 100%;
          max-width: 500px;
          border: 1px solid #e2e8f0;
          position: relative;
        }
        .back-link {
            position: absolute;
            left: 2.5rem;
            top: 2.5rem;
            color: #64748b;
            transition: color 0.2s;
        }
        .back-link:hover {
            color: var(--primary);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .auth-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }
        .auth-header p {
          color: #64748b;
          font-size: 0.875rem;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }
        .full-width {
            grid-column: span 2;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
        }
        .form-group input, .form-group textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 0.75rem 1rem;
          border: 1px solid #cbd5e1;
          border-radius: 0.75rem;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-group input:focus, .form-group textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        .form-group input:disabled {
          color: #64748b;
        }

        /* Verification input styles */
        .phone-verify-container {
            display: flex;
            gap: 0.5rem;
        }
        .phone-verify-container input {
            flex: 1;
        }
        .verify-btn {
            background: #f1f5f9;
            color: #334155;
            border: 1px solid #cbd5e1;
            padding: 0 1rem;
            border-radius: 0.75rem;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
        }
        .verify-btn:hover:not(:disabled) {
            background: #e2e8f0;
            color: #0f172a;
        }
        .verify-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .verify-confirm-btn {
            background: #10b981;
            color: white;
            border-color: #10b981;
        }
        .verify-confirm-btn:hover:not(:disabled) {
            background: #059669;
            color: white;
        }
        .otp-group {
            animation: slideDown 0.3s ease-out;
            background: #f8fafc;
            padding: 1rem;
            border-radius: 0.75rem;
            border: 1px dashed #cbd5e1;
        }
        .verification-success {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            background: #f0fdf4;
            color: #166534;
            padding: 0.75rem;
            border-radius: 0.75rem;
            font-size: 0.9rem;
            font-weight: 600;
            border: 1px solid #bbf7d0;
            animation: fadeIn 0.3s;
        }
        
        .error-message {
          color: #ef4444;
          font-size: 0.875rem;
          text-align: center;
          background: #fef2f2;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #fee2e2;
        }
        .auth-btn {
          width: 100%;
          padding: 0.875rem;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .auth-btn:disabled {
          opacity: 0.6;
          background: #94a3b8;
          cursor: not-allowed;
        }

        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @media (max-width: 640px) {
            .form-grid {
                grid-template-columns: 1fr;
            }
            .full-width {
                grid-column: span 1;
            }
          .auth-card {
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: none;
            background: transparent;
            border: none;
          }
          .auth-container {
            background: white;
            align-items: flex-start;
          }
           .back-link {
                left: 1.5rem;
                top: 1.5rem;
            }
        }
      `}</style>
        </main>
    );
}
