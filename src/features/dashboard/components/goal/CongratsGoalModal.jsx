import React from "react";
import styles from "../css/CongratsGoalModal.module.css";

export default function CongratsGoalModal({ open, onClose, onStart }) {
  if (!open) return null;
  return (
    <div className={styles.overlay} onMouseDown={(e)=>{ if (e.target.classList.contains(styles.overlay)) onClose?.(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="축하 모달">
        <button className={styles.close} aria-label="닫기" onClick={onClose}>✕</button>
        <div className={styles.head}>
          <h3>축하합니다! 🎉</h3>
          <p>목표 설정이 완료되었어요!</p>
        </div>

        <div className={styles.body}>
          <div className={styles.trophy}>🏆</div>
          <h4>이제부터 함께<br/>건강관리 해봐요!</h4>
          <ul className={styles.checklist}>
            <li>✅ 개인 맞춤형 목표 칼로리 계산 완료</li>
            <li>✅ 식단 스타일 설정 완료</li>
            <li>✅ 건강 관리 시작 준비 완료</li>
          </ul>
        </div>

        <div className={styles.foot}>
          <button className={styles.primary} onClick={onStart}>건강관리 시작하기</button>
        </div>
      </div>
    </div>
  );
}
