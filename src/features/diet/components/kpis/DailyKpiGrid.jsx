import styles from "../../css/DietDashboard.module.css";
import KpiProgressCard from "./KpiProgressCard";

function DailyKpiGrid({ values, goal }) {
  return (
    <div className={styles.kpiGrid}>
      <KpiProgressCard label="칼로리"   values={values.cal ?? 0}     goal={goal.cal ?? 0}     unit="kcal" />
      <KpiProgressCard label="탄수화물" values={values.carb ?? 0}    goal={goal.carb ?? 0}    unit="g" />
      <KpiProgressCard label="단백질"   values={values.protein ?? 0} goal={goal.protein ?? 0} unit="g" />
      <KpiProgressCard label="지방"     values={values.fat ?? 0}     goal={goal.fat ?? 0}     unit="g" />
    </div>
  );
}

export default DailyKpiGrid;


