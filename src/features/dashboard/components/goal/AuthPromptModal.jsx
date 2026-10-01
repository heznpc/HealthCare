// src/components/modals/AuthPromptModal.jsx
import React from "react";
// goal/AuthPromptModal.jsx
import styles from "features/dashboard/components/css/AuthPromptModal.module.css";

export default function AuthPromptModal({ open, onClose, onSignup, onBrowse }) {
  if (!open) return null;

  const handleOverlay = (e) => {
    if (e.target.classList.contains(styles.modalOverlay)) onClose?.();
  };

  return (
    <div className={styles.modalOverlay} onMouseDown={handleOverlay}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="로그인 안내">
        <header className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <h3 className={styles.modalTitle}>어서오세요!</h3>
            <div className={styles.welcomeIcon}>👋</div>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="닫기">✕</button>
        </header>

        <div className={styles.modalBody}>
          <div className={styles.contentCenter}>
            <h4 className={styles.mainText}>
              더 많은 기능과 개인 맞춤 서비스를<br />이용하려면 가입하세요.
            </h4>
            <p className={styles.subText}>계속 진행하려면 아래 옵션을 선택해주세요.</p>

            <div className={styles.optionCards}>
              <button className={styles.optionCard} onClick={onBrowse}>
                <div className={styles.optionIcon}>🔍</div>
                <div className={styles.optionTitle}>둘러보기</div>
                <div className={styles.optionDesc}>가입 없이 기본 기능 체험</div>
              </button>

              <button className={styles.optionCard} onClick={onSignup}>
                <div className={styles.optionIcon}>✨</div>
                <div className={styles.optionTitle}>회원가입</div>
                <div className={styles.optionDesc}>개인 맞춤형 서비스 이용</div>
              </button>
            </div>
          </div>
        </div>

        <footer className={styles.modalFooter}>
          <div className={styles.loginPrompt}>
            <span className={styles.loginText}>이미 계정이 있어요!</span>
            <button className={styles.loginLink} onClick={() => (window.location.href = "/login")}>
              로그인하기
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
