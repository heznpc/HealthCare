// src/features/dashboard/components/goal/WelcomeModal.jsx
import React, { useEffect, useState } from "react";
import styles from "features/dashboard/components/css/WelcomeModal.module.css";

export default function WelcomeModal({ open, onClose, onContinue, isNewUser = false, hasGoal = false }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) return;
    if (isNewUser && hasGoal) setStep(2);
    else setStep(0);
  }, [open, isNewUser, hasGoal]);

  if (!open) return null;

  const steps = [
    {
      title: "처음이신가요?",
      subtitle: "환영해요! 👋",
      content: (
        <div className={styles.contentCenter}>
          <div className={styles.bigIcon}>🌟</div>
          <p className={styles.mainText}>건강한 생활 시작을 응원합니다.</p>
          <p className={styles.subText}>지금부터 함께 여정을 시작해요.</p>
        </div>
      ),
      btn: "시작하기",
    },
    {
      title: "성공적인 건강 관리를 위해",
      subtitle: "목표부터 설정해봐요! 🎯",
      content: (
        <div className={styles.contentCenter}>
          <div className={styles.goalSteps}>
            {["활동량 입력", "신체/체중", "목표/칼로리", "식단 스타일"].map((t, i) => (
              <div key={i} className={styles.stepItem}>
                <div className={styles.stepNumber}>{i + 1}</div>
                <span>{t}</span>
              </div>
            ))}
          </div>
          <p className={styles.subText}>개인 맞춤형 목표가 효과를 높입니다.</p>
        </div>
      ),
      btn: "목표 설정하러 가기",
    },
    {
      title: "축하합니다! 🎉",
      subtitle: "목표 설정 완료",
      content: (
        <div className={styles.contentCenter}>
          <div className={styles.bigIcon}>🏆</div>
          <ul className={styles.checkList}>
            <li>✅ 목표 칼로리 계산 완료</li>
            <li>✅ 식단 스타일 설정 완료</li>
            <li>✅ 시작 준비 완료</li>
          </ul>
          <p className={styles.subText}>이제 대시보드에서 기록을 시작하세요.</p>
        </div>
      ),
      btn: "건강관리 시작하기",
    },
  ];

  const onNext = () => {
    if (step === 0) setStep(1);
    else if (step === 1) onContinue?.();
    else onClose?.();
  };

  const close = () => {
    setStep(0);
    onClose?.();
  };

  const overlayClick = (e) => {
    if (e.target.classList.contains(styles.modalOverlay)) close();
  };

  const s = steps[step];

  return (
    <div className={styles.modalOverlay} onMouseDown={overlayClick}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="환영합니다">
        <header className={styles.modalHeader}>
          <div>
            <h3 className={styles.title}>{s.title}</h3>
            <h4 className={styles.subtitle}>{s.subtitle}</h4>
          </div>
          <button className={styles.closeButton} onClick={close} aria-label="닫기">
            ✕
          </button>
        </header>

        <div className={styles.modalBody}>{s.content}</div>

        <footer className={styles.modalFooter}>
          {step > 0 && step < 2 && (
            <button className={styles.secondary} onClick={() => setStep(step - 1)}>
              이전
            </button>
          )}
          <button className={styles.primary} onClick={onNext}>
            {s.btn}
          </button>
        </footer>

        {step < 2 && (
          <div className={styles.progress}>
            {[0, 1].map((i) => (
              <div key={i} className={`${styles.dot} ${i === step ? styles.active : ""}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
