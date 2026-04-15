import styles from "./page.module.css";
import { Users, CheckCircle, MessageCircle, CreditCard, Monitor, Plus } from "lucide-react";
import Link from 'next/link';
import { getSession } from "@/lib/auth";
import RiskAnalysisWidget from "@/components/RiskAnalysisWidget";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();
  const academyName = session?.user?.academy_name || session?.user?.admin_name || "AI-PASS";

  return (
    <main className={styles.main}>
      <header className={styles.hero} id="tour-welcome">
        <div className={styles.badge}>v2.0 Stable</div>
        <h1 className="heading-xl" style={{ marginBottom: "0.5rem", color: "var(--primary)" }}>
          {academyName}
        </h1>
        <p className="text-sub">지능형 학생 출결 및 학원 관리 서비스</p>
      </header>

      <RiskAnalysisWidget />

      <div className={styles.grid}>
        <Link href="/students" className={styles.card} id="tour-student-management">
          <Users size={48} color="#ec4899" style={{ marginBottom: "1.5rem" }} />
          <h2>학생 관리</h2>
          <p>학생 등록, 수정 및 정보 통합 관리</p>
        </Link>

        <Link href="/attendance" className={styles.card} id="tour-attendance">
          <CheckCircle size={48} color="#f59e0b" style={{ marginBottom: "1.5rem" }} />
          <h2>출석부</h2>
          <p>실시간 등하원 체크 및 요약 통계</p>
        </Link>

        <Link href="/message" className={styles.card} id="tour-message">
          <MessageCircle size={48} color="#10b981" style={{ marginBottom: "1.5rem" }} />
          <h2>알림 전송</h2>
          <p>학부모님 카톡/문자 자동 알림</p>
        </Link>

        <Link href="/tuition" className={styles.card} id="tour-tuition">
          <CreditCard size={48} color="#06b6d4" style={{ marginBottom: "1.5rem" }} />
          <h2>수강료 관리</h2>
          <p>미납 내역 및 청구서 발송</p>
        </Link>
      </div>

      <div className={styles.pcHide}>
        <div style={{ padding: "1rem", width: "100%" }}>
          <Link href="/kiosk" className={styles.card} id="tour-kiosk" style={{ backgroundColor: "#f5f3ff", borderColor: "#8b5cf6" }}>
            <Monitor size={48} color="#8b5cf6" style={{ marginBottom: "1.5rem" }} />
            <h2 style={{ color: "#8b5cf6" }}>키오스크 모드</h2>
            <p>학생 전용 셀프 출석 단말기</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
