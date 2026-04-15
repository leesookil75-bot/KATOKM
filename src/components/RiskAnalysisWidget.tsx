'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, TrendingDown } from 'lucide-react';
import styles from './RiskAnalysisWidget.module.css';

interface RiskStudent {
    id: number;
    name: string;
    class_name: string;
    score: number;
    riskLevel: 'Red' | 'Yellow' | 'Green';
    reasons: string[];
}

export default function RiskAnalysisWidget() {
    const [students, setStudents] = useState<RiskStudent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRiskData = async () => {
            try {
                const res = await fetch('/api/admin/analytics/risk');
                if (res.ok) {
                    const data = await res.json();
                    setStudents(data);
                }
            } catch (err) {
                console.error("Failed to fetch risk analytics", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRiskData();
    }, []);

    if (loading) {
        return (
            <div className={styles.widgetContainer}>
                <div className={styles.skeleton}>데이터 분석 중...</div>
            </div>
        );
    }

    const atRiskStudents = students.filter(s => s.riskLevel !== 'Green');
    const redStudents = atRiskStudents.filter(s => s.riskLevel === 'Red');
    const yellowStudents = atRiskStudents.filter(s => s.riskLevel === 'Yellow');

    if (atRiskStudents.length === 0) {
        return (
            <div className={`${styles.widgetContainer} ${styles.safe}`}>
                <div className={styles.header}>
                    <h3>관원 이탈 위험 분석</h3>
                </div>
                <div className={styles.safeMessage}>
                    🎉 현재 등록된 관원들의 출결 및 납부 상태가 매우 안정적입니다.
                </div>
            </div>
        );
    }

    return (
        <div className={styles.widgetContainer}>
            <div className={styles.header}>
                <h3 className={styles.title}>
                    <TrendingDown className={styles.titleIcon} size={20} />
                    관원 이탈 위험 경보
                </h3>
                <span className={styles.badge}>
                    집중 케어 대상: {atRiskStudents.length}명 (위험 {redStudents.length} / 주의 {yellowStudents.length})
                </span>
            </div>

            <div className={styles.list}>
                {atRiskStudents.slice(0, 5).map(student => (
                    <div key={student.id} className={`${styles.item} ${student.riskLevel === 'Red' ? styles.redItem : styles.yellowItem}`}>
                        <div className={styles.itemHeader}>
                            <span className={styles.studentName}>
                                {student.riskLevel === 'Red' ? <AlertTriangle size={16} /> : <AlertCircle size={16} />}
                                {student.name} ({student.class_name || '반 미지정'})
                            </span>
                            <span className={styles.score}>위험도: {student.score}점</span>
                        </div>
                        <div className={styles.reasons}>
                            {student.reasons.map((r, i) => (
                                <span key={i} className={styles.reasonTag}>{r}</span>
                            ))}
                        </div>
                    </div>
                ))}
                {atRiskStudents.length > 5 && (
                    <div className={styles.more}>
                        + 그 외 {atRiskStudents.length - 5}명의 요주의 관원이 있습니다.
                    </div>
                )}
            </div>
        </div>
    );
}
