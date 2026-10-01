import styles from "../../css/DietDashboard.module.css";
import { calculateMonthlyAvgCalories, calculateMonthlyAchievedDays, calculateMonthlyRecordRate } from "../../utils/KpiCalculator";
import KpiSimpleCard from "./KpiSimpleCard";

function MonthlyKpiGrid({ daily, goal }) {


  // 월간 평균 칼로리 계산
  const avgMonthCalories = calculateMonthlyAvgCalories(daily);

  // 월간 목표 달성일 계산
  const calMonthlyGoalDays = calculateMonthlyAchievedDays(daily, goal);

  // 월간 식단 기록률 계산
  const recordRate = calculateMonthlyRecordRate(daily);


  return (
    <div className={styles.kpiGrid}>
      <KpiSimpleCard label="월간 평균 칼로리" value={avgMonthCalories} unit="kcal" />
      <KpiSimpleCard label="목표 달성일" value={calMonthlyGoalDays}  unit="일" />
      <KpiSimpleCard label="식단 기록률" value={recordRate}  unit="%" />
    </div>
  );
}

export default MonthlyKpiGrid;

