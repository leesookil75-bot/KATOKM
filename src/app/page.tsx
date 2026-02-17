import styles from "./page.module.css";
import { Users, CheckCircle, MessageCircle, CreditCard, Smartphone, Plus } from "lucide-react";
import Link from 'next/link';
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  const academyName = session?.user?.academy_name || session?.user?.admin_name || "출결 매니저";

  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <div className={styles.badge}>v2.0 Stable</div>
        <h1 className="heading-xl" style={{ marginBottom: "0.5rem", color: "var(--primary)" }}>
          {academyName}
        </h1>
        <p className="text-sub">지능형 학생 출결 및 학원 관리 서비스</p>
      </header>

      <div className={styles.grid}>
        <Link href="/students" className={styles.card}>
          <Users size={32} color="var(--primary)" style={{ marginBottom: "1rem" }} />
          <h2>학생 관리</h2>
          <p>학생 등록, 수정 및 정보 통합 관리</p>
        </Link>

        <Link href="/attendance" className={styles.card}>
          <CheckCircle size={32} color="var(--secondary)" style={{ marginBottom: "1rem" }} />
          <h2>출석부</h2>
          <p>실시간 등하원 체크 및 요약 통계</p>
        </Link>

        <Link href="/message" className={styles.card}>
          <MessageCircle size={32} color="#10b981" style={{ marginBottom: "1rem" }} />
          <h2>알림 전송</h2>
          <p>학부모님 카톡/문자 자동 알림</p>
        </Link>

        <Link href="/tuition" className={styles.card}>
          <CreditCard size={32} color="#f59e0b" style={{ marginBottom: "1rem" }} />
          <h2>수강료 관리</h2>
          <p>미납 내역 및 청구서 발송</p>
        </Link>

        <Link href="/kiosk" className={styles.card} style={{ borderColor: "var(--primary)", backgroundColor: "#f5f3ff" }}>
          <Smartphone size={32} color="var(--primary)" style={{ marginBottom: "1rem" }} />
          <h2 style={{ color: "var(--primary)" }}>키오스크 모드</h2>
          <p>학생 전용 셀프 출석 단말기</p>
        </Link>
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <Link href="/attendance" className="btn btn-primary">
          <Plus size={18} style={{ marginRight: "8px" }} />
          <span>오늘의 출석 체크하러 가기</span>
        </Link>
      </div>
    </main>
  );
}
