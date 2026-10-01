import { showConfirm } from '../../../../utils/dialogs';
import React from "react";
import styles from "./css/GoalViewDialog.module.css";

export default function GoalViewDialog({ open, goal, onClose, onEdit, onDelete }) {
  if (!open || !goal) return null;

  const handleOutside = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const handleDelete = async () => {
    if (typeof window !== "undefined" && await showConfirm("현재 목표를 삭제할까요?")) {
      onDelete?.();
    }
  };

  return (
    <div className={styles.overlay} onMouseDown={handleOutside}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="현재 목표">
        <header className={styles.header}>
          <h3>현재 목표</h3>
          <button className={styles.icon} onClick={onClose} aria-label="닫기">✕</button>
        </header>

        <div className={styles.body}>
          <div className={styles.grid2}>
            <div className={styles.card}>
              <h4>요약</h4>
              <ul className={styles.list}>
                <li>목표 칼로리: <b>{goal.targetCalories?.toLocaleString?.() || goal.targetCalories}</b> kcal/일</li>
                <li>예상 기간: <b>{goal.weeksNeeded}</b> 주</li>
                <li>스타일: <b>{goal.dietStyle}</b></li>
                <li>활동량: <b>{goal.activityKey}</b> (×{goal.activityFactor})</li>
              </ul>
            </div>

            <div className={styles.card}>
              <h4>신체/에너지</h4>
              <ul className={styles.list}>
                <li>성별: <b>{goal.sex === "F" ? "여" : "남"}</b></li>
                <li>나이/키: <b>{goal.age}</b>세 / <b>{goal.heightCm}</b>cm</li>
                <li>시작→목표 체중: <b>{goal.startWeight}</b>kg → <b>{goal.goalWeight}</b>kg</li>
                <li>BMR/TDEE: <b>{goal.bmr?.toLocaleString?.()}</b> / <b>{goal.tdee?.toLocaleString?.()}</b> kcal</li>
              </ul>
            </div>
          </div>

          <div className={styles.meta}>
            생성일: {new Date(goal.createdAt).toLocaleString()}
            {goal.updatedAt && <> · 수정일: {new Date(goal.updatedAt).toLocaleString()}</>}
          </div>
        </div>

        <footer className={styles.footer}>
          <button className={styles.ghost} onClick={onClose}>닫기</button>
          <div className={styles.spacer} />
          <button onClick={onEdit}>수정</button>
          <button className={styles.danger} onClick={handleDelete}>제거</button>
        </footer>
      </div>
    </div>
  );
}
