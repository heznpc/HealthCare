import DailyKpiGrid from "../kpis/DailyKpiGrid";
import DailyBarByTime from "../charts/DailyBarByTime";
import MealPieToday from "../charts/MealPieToday";
import TodayMealList from "../list/TodayMealList";
import useDietData from "../../hooks/UseDietData";
import { useAuth } from "../../../../auth/useAuth";
import styles from "../../css/DietDashboard.module.css";
import printBtnImg from '../../../img/printBtnImg.png';

// 일간 뷰
function DailyTab() {
  const { user } = useAuth();
  const { date, setDate, records, values, goal } = useDietData(user, { mode: "day" });

  return (
    <div className={styles.dailyTabWrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <img 
          src={printBtnImg} 
          alt="Print" 
          style={{
            marginRight: 15,
            width: 30, 
            height: 30, 
            cursor: 'pointer'
          }} 
          onClick={() => window.print()}
        />
      </div>

      <DailyKpiGrid values={values} goal={goal} />

      <div className={styles.dailyCharts}>
        <div className={styles.dailyChartBox}>
          <h4>오늘 시간별 칼로리 섭취량</h4>
          <div className={styles.dailyBarByTimeChart}>
            <DailyBarByTime date={date} records={records} />
          </div>
        </div>

        <div className={styles.dailyChartBox}>
          <h4>오늘 식사별 칼로리 섭취량</h4>
          <div className={styles.mealPieTodayChart}>
            <MealPieToday date={date} records={records} />
          </div>
        </div>
      </div>

      <div className={styles.todayMealList}>
        <h4>오늘의 식사 기록</h4>
        <TodayMealList date={date} records={records} />
      </div>
    </div>
  );
}

export default DailyTab;


