"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, UserPlus, ShieldCheck, Users } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.role === "SUPER") {
          router.push("/super-admin");
        } else {
          router.push("/");
        }
      } else {
        setError(data.error || "로그인에 실패했습니다.");
      }
    } catch (err) {
      setError("서버와의 통신에 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <ShieldCheck size={40} color="var(--primary)" />
          </div>
          <h1>출결 매니저 v2.0</h1>
          <p>관리자 로그인</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">아이디</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary auth-btn" disabled={isLoading}>
            {isLoading ? "로그인 중..." : "로그인"}
            {!isLoading && <LogIn size={18} style={{ marginLeft: "8px" }} />}
          </button>
        </form>

        <div className="auth-footer">
          <p>아직 회원이 아니신가요?</p>
          <Link href="/signup" className="signup-link">
            <UserPlus size={16} style={{ marginRight: "4px" }} />
            학원 관리자 회원가입
          </Link>

          <div className="parent-link-box">
            <p>자녀의 출결을 확인하고 싶으신가요?</p>
            <Link href="/parent/login" className="parent-login-link">
              <Users size={16} style={{ marginRight: "4px" }} />
              학부모 로그인 바로가기
            </Link>
          </div>
        </div>
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
          max-width: 400px;
          border: 1px solid #e2e8f0;
        }
        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .auth-logo {
          margin-bottom: 1rem;
          display: flex;
          justify-content: center;
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
          flex-col;
          gap: 1.25rem;
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
        .form-group input {
          padding: 0.75rem 1rem;
          border: 1px solid #cbd5e1;
          border-radius: 0.75rem;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-group input:focus {
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
          margin-top: 0.5rem;
        }
        .auth-footer {
          margin-top: 2rem;
          text-align: center;
          padding-top: 1.5rem;
          border-top: 1px solid #f1f5f9;
        }
        .auth-footer p {
          color: #64748b;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }
        .signup-link {
          color: var(--primary);
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }
        .signup-link:hover {
          text-decoration: underline;
        }
        .parent-link-box {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px dashed #e2e8f0;
        }
        .parent-login-link {
          color: #10b981;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          background: #f0fdf4;
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .parent-login-link:hover {
          background: #dcfce7;
          transform: translateY(-1px);
        }

        @media (max-width: 640px) {
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
            padding-top: 3rem;
          }
        }
      `}</style>
    </main>
  );
}
