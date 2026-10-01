// 주간 뷰
import { useMemo } from "react";
import { useAuth } from "../../../../auth/useAuth";
import useDietData from "../../hooks/UseDietData";
import { aggregateByDate } from "../../utils/DataAggregator";
import WeeklyCaloriesTrend from "../charts/WeeklyCaloriesTrend";
import WeeklyMacroAverage from "../charts/WeeklyMacroAverage";
import styles from "../../css/DietDashboard.module.css";
import WeeklyKpiGrid from "../kpis/WeeklyKpiGrid";
import DailyKpiGrid from "../kpis/DailyKpiGrid";
import printBtnImg from '../../../img/printBtnImg.png';

function WeeklyTab() {
  const { user } = useAuth();
  const { date, setDate, range, records, values, goal, shiftDays } =
    useDietData(user, { mode: "week" });
  

  // 주간 요일별 계산을 위한 헬퍼 함수들
  const getStartOfWeek = (dateStr) => {
    const d = new Date(dateStr);
    const day = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
    d.setDate(d.getDate() - day);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const getWeekDates = (dateStr) => {
    const start = getStartOfWeek(dateStr);
    const dates = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, "0");
      const d = String(currentDate.getDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
    }
    
    return dates;
  };

  // 날짜별 집계
  const daily = useMemo(() => aggregateByDate(records), [records]);

  
  // 요일별 데이터 계산
  const weeklyByDay = useMemo(() => {
    const weekDates = getWeekDates(date);                    // 해당 주의 7개 날짜 문자열 배열
    const weekdays  = ['월', '화', '수', '목', '금', '토', '일'];

    return weekDates.map((dateStr, index) => {

      // 그 날짜에 집계된 데이터가 있으면 사용, 없으면 0으로 채움
      const dayData = daily.find(d => d.date === dateStr) || {
        date: dateStr, cal: 0, proteinG: 0, carbG: 0, fatG: 0
      };

      return {
        ...dayData,
        dayName: weekdays[index],                            // 요일 라벨
        dayIndex: index,                                     // 0~6
        formattedDate: new Date(dateStr).getDate() + '일'    // '20일' 같은 표시용
      };
    });
  }, [daily, date]);

  return (
    <div className={styles.weeklyTabWrap}>
      <div className={styles.weeklyToolbar} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button onClick={() => shiftDays(-7)}>
            ‹ 지난주
          </button>&nbsp;&nbsp;
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />&nbsp;&nbsp;
          <button onClick={() => shiftDays(7)}>
            다음주 ›
          </button>&nbsp;&nbsp;
          <span className={styles.weeklyRange}>
            기간 : {range.start} ~ {range.end}
          </span>
        </div>
        
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

      <DailyKpiGrid values={values} goal={goal}/>
      <WeeklyKpiGrid values={values} goal={goal} daily={daily} />
      
      <div className={styles.weeklyCharts}>
        <div className={styles.weeklyChartBox}>
          <h4>주간 섭취 칼로리 추이</h4>
          <div className={styles.weeklyLineChart}>
            <WeeklyCaloriesTrend 
              weeklyByDay={weeklyByDay}
              />
          </div>
        </div>

        <div className={styles.weeklyChartBox}>
          <h4>주간 섭취 영양소 평균</h4>
          <div className={styles.weeklyMacroAverageChart}>
            <WeeklyMacroAverage
              weeklyIntake={{
                carb: Math.round(values.carb / 7),
                protein: Math.round(values.protein / 7),
                fat: Math.round(values.fat / 7),
              }}
              weeklyGoal={{
                carb: Math.round(goal.carb / 7),
                protein: Math.round(goal.protein / 7),
                fat: Math.round(goal.fat / 7),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeeklyTab;


