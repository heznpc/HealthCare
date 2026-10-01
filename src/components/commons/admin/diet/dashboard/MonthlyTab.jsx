import React, { useMemo, useState } from "react";
import { storage } from "../../../../../utils/storage";
import { aggregate, calculateNutritionTargets } from "../../../../../features/diet/utils/NutritionUtils";
import MonthlyDailyActivity from "../charts/monthly/MonthlyDailyActivity";
import MonthlyWeeklyGoals from "../charts/monthly/MonthlyWeeklyGoals";
import MonthlyCalorieDistribution from "../charts/monthly/MonthlyCalorieDistribution";
import MonthlyPopularFoods from "../charts/monthly/MonthlyPopularFoods";
import styles from "../css/Dashboard.module.css";

function MonthlyTab() {
        const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
        const [ageGroup, setAgeGroup] = useState('전체'); // 연령대 필터
        const [gender, setGender] = useState('전체'); // 성별 필터

        // 사용자 필터링 함수
        const filterUsers = (users) => {
            return users.filter(user => {
                // 연령대 필터
                if (ageGroup !== '전체') {
                    const age = parseInt(user.age) || parseInt(user.profile?.age) || 0;
                    const ageRange = {
                        '10대': [10, 19],
                        '20대': [20, 29],
                        '30대': [30, 39],
                        '40대': [40, 49],
                        '50대': [50, 59],
                        '60대+': [60, 100]
                    };
                    const [min, max] = ageRange[ageGroup] || [0, 100];
                    if (age < min || age > max) return false;
                }

                // 성별 필터
                if (gender !== '전체') {
                    const userGender = user.gender || user.profile?.gender || user.sex;
                    const genderMatch = {
                        '남성': ['male', 'M', '남'],
                        '여성': ['female', 'F', '여']
                    };
                    if (!genderMatch[gender]?.includes(userGender)) return false;
                }

                return true;
            });
        };

        const stats = useMemo(() => {
            // 모든 활성 사용자 가져오기
            const allUsers = storage.getActiveUsers();
            const users = filterUsers(allUsers);
            const dietRecords = storage.get('dietRecords') || {};
            
            // 선택된 날짜의 월 정보 가져오기
            const selectedDateObj = new Date(selectedDate);
            const year = selectedDateObj.getFullYear();
            const month = selectedDateObj.getMonth();
            
            // 해당 월의 모든 날짜 생성
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const monthDates = [];
            
            for (let day = 1; day <= lastDay.getDate(); day++) {
                const date = new Date(year, month, day);
                monthDates.push(date.toISOString().split('T')[0]);
            }
            
            // 전체 시스템에서 사용되는 모든 식사 타입 수집
            const allMealTypes = new Set();
            Object.values(dietRecords).forEach(userRecords => {
                if (Array.isArray(userRecords)) {
                    userRecords.forEach(record => {
                        if (record.mealType) {
                            allMealTypes.add(record.mealType);
                        }
                    });
                }
            });
    
            const mealTypesArray = Array.from(allMealTypes);
            
            // 월간 데이터 수집
            let totalMonthRecords = 0;
            let totalMonthCalories = 0;
            let totalGoalAchievement = 0;
            let validUsersCount = 0;
            let activeUsersInMonth = 0;
            let totalPossibleMealSlots = 0;
            let completedMealSlots = 0;
    
            users.forEach(user => {
                const userKey = user.userKey || user.id;
                const userRecords = dietRecords[userKey] || [];
                
                // 월간 기록 필터링
                const monthRecords = userRecords.filter(record => 
                    monthDates.includes(record.date)
                );
                
                if (monthRecords.length > 0) {
                    activeUsersInMonth++;
                    totalMonthRecords += monthRecords.length;
                    
                    // 월간 총 칼로리
                    const monthCalories = aggregate(monthRecords).cal;
                    totalMonthCalories += monthCalories;
                    
                    // 월간 평균 목표 달성률 계산
                    const nutritionTargets = calculateNutritionTargets(user);
                    if (nutritionTargets && nutritionTargets.cal > 0) {
                        const dailyTargetCalories = nutritionTargets.cal;
                        const monthTargetCalories = dailyTargetCalories * monthDates.length;
                        const achievementRate = (monthCalories / monthTargetCalories) * 100;
                        totalGoalAchievement += Math.min(achievementRate, 100);
                        validUsersCount++;
                    }
                    
                    // 월간 식사 완성도 계산
                    monthDates.forEach(date => {
                        const dayRecords = monthRecords.filter(record => record.date === date);
                        mealTypesArray.forEach(mealType => {
                            totalPossibleMealSlots++;
                            const mealRecords = dayRecords.filter(record => record.mealType === mealType);
                            if (mealRecords.length > 0) {
                                completedMealSlots++;
                            }
                        });
                    });
                }
            });
    
            return {
                averageGoalAchievement: validUsersCount > 0 ? (totalGoalAchievement / validUsersCount) : 0,
                totalMonthRecords: totalMonthRecords,
                averageMonthlyCalories: activeUsersInMonth > 0 ? (totalMonthCalories / activeUsersInMonth) : 0,
                mealCompletionRate: totalPossibleMealSlots > 0 ? (completedMealSlots / totalPossibleMealSlots) * 100 : 0,
                activeUsersInMonth,
                totalMealTypes: mealTypesArray.length,
                monthRange: `${year}년 ${month + 1}월 (${monthDates.length}일)`
            };
        }, [selectedDate, ageGroup, gender]);
    
    
        return(
           <div className={styles.dailyTabWrap}>
                <div className={styles.dateSelector}>
                    <label htmlFor="month-picker" className={styles.dateLabel}>월간 선택:</label>
                    <input
                        id="month-picker"
                        type="month"
                        value={selectedDate.slice(0, 7)} // YYYY-MM 형식
                        onChange={(e) => setSelectedDate(e.target.value + '-01')} // 월의 첫 번째 날로 설정
                        className={styles.dateInput}
                        max={new Date().toISOString().slice(0, 7)} // 현재 월까지만 선택 가능
                    />
                    <label htmlFor="age-filter" className={styles.dateLabel}>연령대:</label>
                    <select
                        id="age-filter"
                        value={ageGroup}
                        onChange={(e) => setAgeGroup(e.target.value)}
                        className={styles.dateInput}
                    >
                        <option value="전체">전체</option>
                        <option value="10대">10대</option>
                        <option value="20대">20대</option>
                        <option value="30대">30대</option>
                        <option value="40대">40대</option>
                        <option value="50대">50대</option>
                        <option value="60대+">60대+</option>
                    </select>
                    
                    <label htmlFor="gender-filter" className={styles.dateLabel}>성별:</label>
                    <select
                        id="gender-filter"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className={styles.dateInput}
                    >
                        <option value="전체">전체</option>
                        <option value="남성">남성</option>
                        <option value="여성">여성</option>
                    </select>
                </div>
                
                <div className={styles.statsGrid}>
                    <div className={`${styles.statCard} ${styles.success}`}>
                        <div className={`${styles.statNumber} ${styles.success}`}>{stats.averageGoalAchievement.toFixed(1)}%</div>
                        <div className={styles.statLabel}>월간 평균 목표 달성률</div>
                        <div className={`${styles.statChange} ${styles.positive}`}>월간 기준</div>
                    </div>
                    
                    <div className={styles.statCard}>
                        <div className={`${styles.statNumber} ${styles.primary}`}>{stats.totalMonthRecords.toLocaleString()}개</div>
                        <div className={styles.statLabel}>월간 총 기록</div>
                        <div className={`${styles.statChange} ${styles.positive}`}>{stats.activeUsersInMonth}명 활동</div>
                    </div>
                    
                    <div className={styles.statCard}>
                        <div className={`${styles.statNumber} ${styles.primary}`}>{Math.round(stats.averageMonthlyCalories).toLocaleString()}kcal</div>
                        <div className={styles.statLabel}>월간 평균 칼로리</div>
                        <div className={`${styles.statChange} ${styles.neutral}`}>1인당 평균</div>
                    </div>
                    
                    <div className={styles.statCard}>
                        <div className={`${styles.statNumber} ${styles.primary}`}>{stats.mealCompletionRate.toFixed(1)}%</div>
                        <div className={styles.statLabel}>월간 식사 완성도</div>
                        <div className={`${styles.statChange} ${styles.positive}`}>{stats.totalMealTypes}개 식사타입 기준</div>
                    </div>
                </div>
    
                <div className={styles.chartsGrid}>
                    <div className={styles.chartSection}>
                        <h2 className={styles.chartTitle}>월간 일별 활동 추이</h2>
                        <div className={styles.chartContainer}>
                            <MonthlyDailyActivity selectedDate={selectedDate} />
                        </div>
                    </div>
    
                    <div className={styles.chartSection}>
                        <h2 className={styles.chartTitle}>월간 주차별 목표 달성률</h2>
                        <div className={styles.chartContainer}>
                            <MonthlyWeeklyGoals selectedDate={selectedDate} />
                        </div>
                    </div>
    
                    <div className={styles.chartSection}>
                        <h2 className={styles.chartTitle}>월간 칼로리 분포 변화</h2>
                        <div className={styles.chartContainer}>
                            <MonthlyCalorieDistribution selectedDate={selectedDate} />
                        </div>
                    </div>
    
                    <div className={styles.chartSection}>
                        <h2 className={styles.chartTitle}>월간 인기 음식 TOP10</h2>
                        <div className={styles.chartContainer}>
                            <MonthlyPopularFoods selectedDate={selectedDate} />
                        </div>
                    </div>
                </div>
            </div>
        );

}

export default MonthlyTab;