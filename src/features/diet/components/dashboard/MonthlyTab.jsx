import MonthlyCaloriesTrend from "../charts/MonthlyCaloriesTrend";
import styles from "../../css/DietDashboard.module.css";
import MonthlyKpiGrid from "../kpis/MonthlyKpiGrid";
import DailyKpiGrid from "../kpis/DailyKpiGrid";
import { useAuth } from "../../../../auth/useAuth";
import useDietData from "../../hooks/UseDietData";
import MonthlyMacroAverage from "../charts/MonthlyMacroAverage";
import { useMemo } from "react";
import { aggregateByDate } from "../../utils/DataAggregator";
import printBtnImg from '../../../img/printBtnImg.png'; 


// 월간 뷰
function MonthlyTab() {
    // 유저 불러오기
    const { user } = useAuth();
    
    // 월간 모드로 데이터 가져오기
    const { date, setDate, range, records, values, goal } =
    useDietData(user, { mode: "month" });
    
    // 날짜별 집계
    const daily = useMemo(() => aggregateByDate(records), [records]);

    // 월 설정 함수
    const shiftMonths = (n) => {
    const [y, m] = date.slice(0, 7).split("-").map(Number);
    const d = new Date(y, m - 1, 1);   // 해당 달 1일
    d.setMonth(d.getMonth() + n);

    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    setDate(`${yr}-${mo}-01`);  // 월 첫째 날로 설정
    };



    return(    
        <div className={styles.monthlyTabWrap}>
            <div className={styles.monthlyToolbar} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <button onClick={() => shiftMonths(-1)}>
                        ‹ 지난달
                    </button>&nbsp;&nbsp;

                    <input
                        type="month"
                        value={date.slice(0,7)} // YYYY-MM
                        onChange={(e) => setDate(e.target.value + "-01")}
                    />&nbsp;&nbsp;

                    <button onClick={() => shiftMonths(1)}>
                        다음달 ›
                    </button>&nbsp;&nbsp;

                    <span className={styles.monthlyRange}>
                        기간 : {range.start} ~ {range.end}
                    </span>
                </div>
                
                <img 
                    src={printBtnImg} 
                    alt="Print" 
                    style={{
                        marginRight:15,
                        width: 30, 
                        height: 30, 
                        cursor: 'pointer'
                    }} 
                    onClick={() => window.print()}
                />
            </div>

            <DailyKpiGrid values={values} goal={goal}/>
            <MonthlyKpiGrid goal={goal} daily={daily}/>

            <div className={styles.monthlyCharts}>
                <div className={styles.monthlyChartBox}>
                    <h4>월간 섭취 칼로리 추이</h4>
                    <div className={styles.monthlyLineChart}>
                        <MonthlyCaloriesTrend daily={daily} />
                    </div>
                </div>
                <div className={styles.monthlyChartBox}>
                    <h4>월간 섭취 영양소 평균</h4>
                    <div className={styles.monthlyDonutChart}>       
                        <MonthlyMacroAverage
                            monthlyIntake={{
                                carb: Math.round(values.carb),
                                protein: Math.round(values.protein),
                                fat: Math.round(values.fat),
                            }}
                            monthlyGoal={{
                                carb: Math.round(goal.carb),
                                protein: Math.round(goal.protein),
                                fat: Math.round(goal.fat),
                            }}
                        />
                    </div>
                </div>



            </div>
        </div>
    );
}

export default MonthlyTab;