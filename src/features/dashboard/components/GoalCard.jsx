// src/features/dashboard/components/GoalCard.jsx
import styles from "./css/GoalCard.module.css";

export default function GoalCard({ latestGoal, onOpenGoal, onOpenView }) {
  return (
    <div className={styles.card}>
      <h3>🎯 목표 설정</h3>
      <p>체중·식단·운동 목표를 관리하세요.</p>

      {latestGoal && (
        <div className={styles.goalSummary}>
          <div>목표 칼로리: <strong>{latestGoal.targetCalories}</strong> kcal/일</div>
          <div>예상 기간: <strong>{latestGoal.weeksNeeded}</strong> 주</div>
          <div>스타일: <strong>{latestGoal.dietStyle}</strong></div>
        </div>
      )}

      <div className={styles.actions}>
        {!latestGoal && <button onClick={onOpenGoal}>목표 만들기</button>}
        {latestGoal && (
          <button className={styles.ghost} onClick={onOpenView}>현재 목표 보기</button>
        )}
      </div>
    </div>
  );
}
