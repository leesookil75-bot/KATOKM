"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Lock, ChevronRight, User } from "lucide-react";

export default function ParentLoginPage() {
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/parent/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, password }),
            });

            if (res.ok) {
                router.push("/parent");
            } else {
                const data = await res.json();
                setError(data.error || "로그인에 실패했습니다.");
            }
        } catch (err) {
            setError("서버와 통신 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-icon">
                        <User size={32} color="white" />
                    </div>
                    <h1>학부모 로그인</h1>
                    <p>자녀의 출결 및 수강료 현황을 확인하세요</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label>전화번호</label>
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

                    <div className="input-group">
                        <label>비밀번호</label>
                        <div className="input-wrapper">
                            <Lock size={20} className="icon" />
                            <input
                                type="password"
                                placeholder="초기 비밀번호: 전화번호 뒷자리 4자리"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? "로그인 중..." : "로그인하기"}
                        {!loading && <ChevronRight size={20} />}
                    </button>
                </form>

                <div className="login-footer">
                    <p>비밀번호를 분실하셨나요? <br /><span>다니시는 학원 관리자에게 문의하여 초기화하실 수 있습니다.</span></p>
                </div>
            </div>

            <style jsx>{`
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f1f5f9;
                    padding: 1.5rem;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .login-card {
                    width: 100%;
                    max-width: 400px;
                    background: white;
                    border-radius: 2rem;
                    padding: 2.5rem 2rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                .login-header {
                    text-align: center;
                    margin-bottom: 2.5rem;
                }
                .logo-icon {
                    width: 64px;
                    height: 64px;
                    background: #4f46e5;
                    border-radius: 1.25rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.25rem;
                    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
                }
                .login-header h1 {
                    font-size: 1.75rem;
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
                    border-color: #4f46e5;
                    background: white;
                    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
                }
                .login-button {
                    margin-top: 1rem;
                    background: #4f46e5;
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
                    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
                    border: none;
                    cursor: pointer;
                }
                .login-button:hover:not(:disabled) {
                    background: #4338ca;
                    transform: translateY(-1px);
                    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
                }
                .login-button:active:not(:disabled) {
                    transform: translateY(0);
                }
                .login-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .error-message {
                    color: #ef4444;
                    font-size: 0.875rem;
                    text-align: center;
                    font-weight: 600;
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
            `}</style>
        </div>
    );
}
