"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

// 완전히 안정적인 로딩 방식
const Joyride = dynamic(
  () => import('react-joyride').then(mod => (mod as any).default || (mod as any).Joyride),
  { ssr: false }
) as any;

export default function OnboardingTour() {
  const [run, setRun] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showIntroOverlay, setShowIntroOverlay] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [tourKey, setTourKey] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    // V3 키로 리셋 보장
    const hasSeenOverlay = localStorage.getItem(`aipass_tourOverlay_v3_${pathname}`);
    if (!hasSeenOverlay) {
        setShowIntroOverlay(true);
    }
    
    // 경로 변경 시 초기화
    setRun(false);
    setStepIndex(0);
  }, [pathname]);

  const noTourPaths = ['/login', '/signup', '/admin-login', '/kiosk'];
  if (noTourPaths.includes(pathname)) return null;

  let steps: any[] = [];

  if (pathname === '/') {
    steps = [
      {
        target: '#tour-welcome',
        content: (
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>환영합니다, 원장님! 🎉</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
              AI-PASS 홈 화면입니다.<br/>
              주요 메뉴들을 어떻게 들어가는지 간단히 둘러볼까요?
            </p>
          </div>
        ),
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
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b' }}>출석부 메뉴</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
              학생들이 오늘 학원에 왔는지 실시간으로 확인하고, 내역을 변경할 수 있습니다.
            </p>
          </div>
        ),
      },
      {
        target: '#tour-message',
        content: (
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#10b981' }}>알림 전송 메뉴</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
              학부모님들께 등하원/행사 알림을 수동 혹은 일괄 푸시로 쏠 수 있습니다.
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
              "이번 달 수강료 내주세요"라고 직접 말하기 불편하시죠?<br/>
              간단히 수납 관리를 할 수 있습니다.
            </p>
          </div>
        ),
      }
    ];
  } else if (pathname === '/students') {
    steps = [
      {
        target: '#tour-student-add',
        content: (
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#3b82f6' }}>학생 추가하기</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
              먼저 이 버튼을 눌러서 학생 이름과 부모님 번호를 등록하세요!
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: '#tour-student-table',
        content: (
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#6366f1' }}>실시간 표 수정</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
              메모나 반을 고치고 싶을 때 복잡하게 들어갈 필요 없이, <b>표의 글자를 한 번 콕! 누르면 즉시 그 자리에서 수정 가능</b>합니다.
            </p>
          </div>
        ),
      },
      {
        target: '#tour-student-reset',
        content: (
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#f43f5e' }}>비밀번호 강제 초기화</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
              학부모님이 앱 비밀번호를 잊어버렸을 때, 이 리셋 버튼을 누르면 부모님 휴대폰 번호 뒷자리 4자리로 편하게 초기화됩니다.
            </p>
          </div>
        ),
      }
    ];
  } else if (pathname === '/attendance') {
    steps = [
      {
        target: '#tour-attendance-mode',
        content: (
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#3b82f6' }}>주간/월간 모드</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
              출석부를 5일 단위(주간)로 볼지, 달력처럼 한 달치 통계로 쫙 펼쳐서 볼지 선택할 수 있습니다.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: '#tour-attendance-cell',
        content: (
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#ef4444' }}>간편 결석/지각 처리</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
              출석표에서 동그라미(O)나 점(·) 아이콘을 터치해 보세요.<br/>결석(X)이나 특이사항(△) 처리 팝업과 메모창이 바로 뜹니다!
            </p>
          </div>
        ),
      }
    ];
  } else if (pathname === '/message') {
    steps = [
      {
        target: '#tour-msg-filter',
        content: (
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#8b5cf6' }}>스마트 대상 선택</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
              "이번 달 수강료 미납자"만 쏙! 필터링해서 체크한 뒤, 독촉 푸시를 한 방에 쏠 수 있는 마법의 버튼입니다.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: '#tour-msg-template',
        content: (
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#2dd4bf' }}>템플릿 즐겨찾기</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
              "휴원 안내" 같은 자주 보내는 글은 매번 쓰지 마시고 템플릿으로 저장해두시면 클릭 한 번에 복사됩니다.
            </p>
          </div>
        ),
      },
      {
        target: '#tour-msg-send',
        content: (
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#3b82f6' }}>최종 발송</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
              스마트폰 문자 앱으로 연결해서 쏘려면 [문자],<br/>앱을 깐 학부모님께 공짜 푸시를 쏘시려면 [푸시전송]을 누르세요!
            </p>
          </div>
        ),
      }
    ];
  } else if (pathname === '/tuition') {
    steps = [
      {
        target: '#tour-tuition-table',
        content: (
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b' }}>원터치 수납표</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
              각 월별 테이블에서 학생 칸을 누르면 "수납 완료" 혹은 "미납" 처리를 기록할 수 있어, 학원 장부가 필요 없어집니다!
            </p>
          </div>
        ),
        disableBeacon: true,
      }
    ];
  }

  const handleJoyrideCallback = (data: any) => {
    const { status, type, index, action } = data;
    
    // 강제 동기화 회피 상수 안전 처리
    if (type === 'step:after') {
      if (action === 'next' || action === 'primary') {
         setStepIndex(index + 1);
      } else if (action === 'prev') {
         setStepIndex(index - 1);
      }
    }

    if (status === 'finished' || status === 'skipped') {
      setRun(false);
      setStepIndex(0);
    }
  };

  const handleHelpClick = () => {
    if (showIntroOverlay) {
        setShowIntroOverlay(false);
        localStorage.setItem(`aipass_tourOverlay_v3_${pathname}`, 'true');
    }
    
    // 리액트 사이클과 완전 분리하여 렌더링 강제 안정화
    setRun(false);
    setTimeout(() => {
        setTourKey(prev => prev + 1);
        setStepIndex(0);
        setRun(true);
    }, 50);
  };

  if (!isMounted) return null;
  if (steps.length === 0) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-ring {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(79, 70, 229, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }
        .help-pulse {
            animation: pulse-ring 2s infinite !important;
            box-shadow: 0 0 20px rgba(79, 70, 229, 0.8) !important;
        }
        button[class*="beacon"], div[class*="beacon"], .react-joyride__spotlight {
            /* spotlight can be manipulated via options */
        }
        button[class*="beacon"], div[class*="beacon"] {
          display: none !important;
        }
      `}} />
      
      {showIntroOverlay && (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 9980,
            backdropFilter: 'blur(2px)',
            transition: 'opacity 0.3s ease-out'
        }} />
      )}

      {/* @ts-ignore */}
      <Joyride
        key={`${pathname}-${tourKey}`}
        stepIndex={stepIndex}
        disableBeacon={true}
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
            overlayColor: 'rgba(0, 0, 0, 0.65)',
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
          skip: '가이드 종료',
        }}
      />

      <button
        onClick={handleHelpClick}
        className={showIntroOverlay ? "help-pulse" : ""}
        style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '99px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3), 0 4px 6px -2px rgba(79, 70, 229, 0.15)',
            cursor: 'pointer',
            zIndex: 9990,
            fontWeight: '600',
            fontSize: '15px',
            transition: 'transform 0.2s, box-shadow 0.2s',
            animation: !showIntroOverlay ? 'pulse-ring 3s infinite' : 'none',
        }}
        onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
        }}
        title="도움말 보기"
      >
        <span style={{ fontSize: '18px' }}>💡</span> 
        {showIntroOverlay ? '여기를 눌러 투어 시작!' : '도움말 보기'}
      </button>
    </>
  );
}
