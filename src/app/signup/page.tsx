"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, ArrowLeft, CheckCircle2 } from "lucide-react";

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setIsSuccess(true);
            } else {
                setError(data.error || "회원가입에 실패했습니다.");
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
                        <p>슈퍼관리자의 승인 후 출결 매니저를 사용할 수 있습니다.</p>
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
                    <p>출결 매니저 v2.0 시작하기</p>
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
                        <div className="form-group">
                            <label>연락처</label>
                            <input name="phone" value={formData.phone} onChange={handleChange} placeholder="010-0000-0000" required />
                        </div>
                        <div className="form-group">
                            <label>아이디</label>
                            <input name="username" value={formData.username} onChange={handleChange} placeholder="아이디를 정해주세요" required />
                        </div>
                        <div className="form-group full-width">
                            <label>비밀번호</label>
                            <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="비밀번호를 입력하세요" required />
                        </div>
                        <div className="form-group full-width">
                            <label>학원 주소</label>
                            <textarea name="address" value={formData.address} onChange={handleChange} placeholder="학원 주소를 상세히 입력해주세요" required rows={2} />
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn btn-primary auth-btn" disabled={isLoading}>
                        {isLoading ? "가입 신청 중..." : "회원가입 신청"}
                        {!isLoading && <UserPlus size={18} style={{ marginLeft: "8px" }} />}
                    </button>
                </form>
            </div>

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
