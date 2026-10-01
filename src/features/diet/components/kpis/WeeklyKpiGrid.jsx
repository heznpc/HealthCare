import styles from "../../css/DietDashboard.module.css";
import { calculateAchievedDays, calculateAvgCalories, calculateMaxCalorie, findMaxCalorieDay } from "../../utils/KpiCalculator";
import KpiSimpleCard from "./KpiSimpleCard";

function WeeklyKpiGrid({ daily, goal }) {
  
  // 주간 평균 칼로리 계산
  const avgCalories = calculateAvgCalories(daily, 7);

  // 주간 목표 달성일 계산
  const weeklyGoal = { cal: goal.cal / 7};
  const calWeeklyGoalDays = calculateAchievedDays(daily, weeklyGoal);

  // 최고 섭취 칼로리 계산
  const calWeeklyeMaxCal = calculateMaxCalorie(daily);

  // 최고 섭취일 계산
  const calWeeklyMaxDay = findMaxCalorieDay(daily);


  return (
    <div className={styles.kpiGrid}>
      <KpiSimpleCard label="주간 평균 칼로리" value={avgCalories} unit="kcal" />
      <KpiSimpleCard label="목표 달성일" value={calWeeklyGoalDays} unit="일" subtitle="7일 중" />
      <KpiSimpleCard label="최고 섭취일" value={calWeeklyMaxDay} unit="일" subtitle={calWeeklyeMaxCal} />
    </div>
  );
}

export default WeeklyKpiGrid;

