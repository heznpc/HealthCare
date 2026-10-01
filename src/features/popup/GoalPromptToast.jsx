// src/components/GoalPromptToast.jsx
import React, { useEffect, useRef } from "react";
import styles from "./css/GoalPromptToast.module.css";

/**
 * 좌하단 토스트
 * props:
 * - open: boolean
 * - title?: string
 * - message?: string
 * - confirmText?: string
 * - cancelText?: string
 * - onConfirm: () => void
 * - onClose: () => void
 */
export default function GoalPromptToast({
  open,
  title = "목표 설정이 필요합니다",
  message = "체중 기록 전에 목표를 먼저 설정하세요.",
  confirmText = "목표 설정하기",
  cancelText = "나중에",
  onConfirm,
  onClose,
}) {
  const confirmRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Enter") onConfirm?.();
    };
    window.addEventListener("keydown", onKey);

    const t = setTimeout(() => confirmRef.current?.focus(), 0);

    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onClose, onConfirm]);

  if (!open) return null;

  const handleBackdropClick = (e) => {
    // 카드 바깥 클릭 시 닫기
    if (cardRef.current && !cardRef.current.contains(e.target)) onClose?.();
  };

  return (
    <div
      className={styles.wrap}
      role="dialog"
      aria-live="polite"
      aria-modal="false"
      onMouseDown={handleBackdropClick}
    >
      <div className={styles.card} ref={cardRef}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button
            aria-label="닫기"
            className={styles.close}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <button
            ref={confirmRef}
            type="button"
            className={styles.primary}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={onClose}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
