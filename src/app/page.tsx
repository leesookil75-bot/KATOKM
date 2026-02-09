import Image from "next/image";
import styles from "./page.module.css";
import { Users, CheckCircle, MessageCircle, Settings, Plus, BarChart2, Smartphone } from "lucide-react";
import Link from 'next/link';

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <h1 className="heading-xl" style={{ marginBottom: "0.5rem", color: "var(--primary)" }}>
          출결 매니저 v2.0 (Stable)
        </h1>
        <p className="text-sub">간편한 학생 관리와 카톡 알림</p>
      </header>

      <div className={styles.grid}>
        <Link href="/students" className={styles.card}>
          <Users size={32} color="var(--primary)" style={{ marginBottom: "1rem" }} />
          <h2>학생 관리</h2>
          <p>학생 등록 및 수정</p>
        </Link>

        <Link href="/attendance" className={styles.card}>
          <CheckCircle size={32} color="var(--secondary)" style={{ marginBottom: "1rem" }} />
          <h2>출석부</h2>
          <p>주간/월간 출석 관리</p>
        </Link>

        <Link href="/message" className={styles.card}>
          <MessageCircle size={32} color="#10b981" style={{ marginBottom: "1rem" }} />
          <h2>알림 전송</h2>
          <p>학부모님께 메시지 보내기</p>
        </Link>

        <Link href="/kiosk" className={styles.card} style={{ borderColor: "#6366f1", backgroundColor: "#f5f3ff" }}>
          <Smartphone size={32} color="#4f46e5" style={{ marginBottom: "1rem" }} />
          <h2 style={{ color: "#4338ca" }}>키오스크 모드</h2>
          <p>학생용 출석 단말기</p>
        </Link>
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <Link href="/attendance" className="btn btn-primary">
          <Plus size={18} />
          <span>오늘의 출석 체크하러 가기</span>
        </Link>
      </div>
    </main>
  );
}
