"use client";

import { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';

export default function OnboardingTour() {
  const [run, setRun] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check if the user has completed the tour before
    const hasSeenTour = localStorage.getItem('aipass_tour_completed');
    if (!hasSeenTour) {
      // Delay slightly so the UI finishes rendering
      setTimeout(() => {
        setRun(true);
      }, 1000);
    }
  }, []);

  const steps: any[] = [
    {
      target: '#tour-welcome',
      content: (
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>환영합니다, 원장님! 🎉</h3>
          <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
            AI-PASS 학원 관리 시스템에 처음 오셨군요!<br/>
            주요 기능들을 간단히 둘러볼까요?
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-student-management',
      content: (
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#ec4899' }}>학생 관리 메뉴</h3>
          <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
            가장 먼저 이곳에 들어가서 우리 학원 학생들과 학부모님 연락처를 등록해주세요.
          </p>
        </div>
      ),
    },
    {
      target: '#tour-attendance',
      content: (
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b' }}>출결/알림톡 메뉴</h3>
          <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
            학생들이 오늘 학원에 왔는지 실시간으로 확인하고, 등/하원 알림톡이 카카오톡으로 발송되는 내역을 볼 수 있습니다.
          </p>
        </div>
      ),
    },
    {
      target: '#tour-kiosk',
      content: (
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#8b5cf6' }}>스마트 키오스크 🖥️</h3>
          <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
            원장님이 쓰시는 이 기기(PC나 태블릿)를 학생 전용 출결 단말기로 변신시킬 수 있습니다!
          </p>
        </div>
      ),
    },
    {
      target: '#tour-tuition',
      content: (
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#06b6d4' }}>수강료 관리 💰</h3>
          <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
            이제 학부모님들께 "이번 달 수강료 내주세요"라고 직접 말하기 불편하시죠?<br/>
            버튼 하나로 카톡 청구서를 쏠 수 있습니다.
          </p>
        </div>
      ),
    }
  ];

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('aipass_tour_completed', 'true');
    }
  };

  if (!isMounted) return null;

  return (
    <>
      {/* @ts-ignore */}
      <Joyride
        callback={handleJoyrideCallback}
        continuous={true}
        hideCloseButton={false}
        run={run}
        scrollToFirstStep={true}
        showProgress={true}
        showSkipButton={true}
        steps={steps}
        styles={{
          options: {
            zIndex: 10000,
            primaryColor: '#4f46e5',
            textColor: '#1e293b',
            backgroundColor: '#ffffff',
            arrowColor: '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
          },
          buttonNext: {
            backgroundColor: '#4f46e5',
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: 600,
          },
          buttonBack: {
            color: '#64748b',
          },
          buttonSkip: {
            color: '#94a3b8',
          },
          tooltipContainer: {
            textAlign: 'left',
          },
        } as any}
        locale={{
          back: '이전',
          close: '닫기',
          last: '시작하기',
          next: '다음',
          skip: '설명 건너뛰기',
        }}
      />
      {/* 다시 보기 버튼 (우측 하단) */}
      <button
        onClick={() => {
            localStorage.removeItem('aipass_tour_completed');
            setRun(true);
        }}
        style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            zIndex: 9999,
            color: '#4f46e5',
            fontWeight: 'bold',
            fontSize: '20px'
        }}
        title="가이드 투어 다시 보기"
      >
        ?
      </button>
    </>
  );
}
