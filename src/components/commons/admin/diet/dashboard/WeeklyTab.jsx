import React, { useMemo, useState } from "react";
import { storage } from "../../../../../utils/storage";
import { aggregate, calculateNutritionTargets } from "../../../../../features/diet/utils/NutritionUtils";
import WeeklyUserActivity from "../charts/weekly/WeeklyUserActivity";
import WeeklyGoalAchievers from "../charts/weekly/WeeklyGoalAchievers";
import WeeklyCalorieTrend from "../charts/weekly/WeeklyCalorieTrend";
import WeeklyPopularFoods from "../charts/weekly/WeeklyPopularFoods";
import styles from "../css/Dashboard.module.css";

function WeeklyTab() {
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
        
        // 선택된 날짜로부터 주간 범위 계산 (월요일 시작)
        const selectedDateObj = new Date(selectedDate);
        const dayOfWeek = selectedDateObj.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(selectedDateObj);
            date.setDate(selectedDateObj.getDate() + mondayOffset + i);
            weekDates.push(date.toISOString().split('T')[0]);
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
        
        // 주간 데이터 수집
        let totalWeekRecords = 0;
        let totalWeekCalories = 0;
        let totalGoalAchievement = 0;
        let validUsersCount = 0;
        let activeUsersInWeek = 0;
        let totalPossibleMealSlots = 0;
        let completedMealSlots = 0;

        users.forEach(user => {
            const userKey = user.userKey || user.id;
            const userRecords = dietRecords[userKey] || [];
            
            // 주간 기록 필터링
            const weekRecords = userRecords.filter(record => 
                weekDates.includes(record.date)
            );
            
            if (weekRecords.length > 0) {
                activeUsersInWeek++;
                totalWeekRecords += weekRecords.length;
                
                // 주간 총 칼로리
                const weekCalories = aggregate(weekRecords).cal;
                totalWeekCalories += weekCalories;
                
                // 주간 평균 목표 달성률 계산
                const nutritionTargets = calculateNutritionTargets(user);
                if (nutritionTargets && nutritionTargets.cal > 0) {
                    const dailyTargetCalories = nutritionTargets.cal;
                    const weekTargetCalories = dailyTargetCalories * 7;
                    const achievementRate = (weekCalories / weekTargetCalories) * 100;
                    totalGoalAchievement += Math.min(achievementRate, 100);
                    validUsersCount++;
                }
                
                // 주간 식사 완성도 계산
                weekDates.forEach(date => {
                    const dayRecords = weekRecords.filter(record => record.date === date);
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
            totalWeekRecords: totalWeekRecords,
            averageWeeklyCalories: activeUsersInWeek > 0 ? (totalWeekCalories / activeUsersInWeek) : 0,
            mealCompletionRate: totalPossibleMealSlots > 0 ? (completedMealSlots / totalPossibleMealSlots) * 100 : 0,
            activeUsersInWeek,
            totalMealTypes: mealTypesArray.length,
            weekRange: `${weekDates[0]} ~ ${weekDates[6]}`
        };
    }, [selectedDate, ageGroup, gender]);


    return(
       <div className={styles.dailyTabWrap}>
            <div className={styles.dateSelector}>
                <label htmlFor="week-picker" className={styles.dateLabel}>주간 선택:</label>
                <input
                    id="week-picker"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={styles.dateInput}
                    max={new Date().toISOString().split('T')[0]} // 오늘까지만 선택 가능
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
                <span className={styles.weekRange}>({stats.weekRange})</span>
            </div>
            
            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.success}`}>
                    <div className={`${styles.statNumber} ${styles.success}`}>{stats.averageGoalAchievement.toFixed(1)}%</div>
                    <div className={styles.statLabel}>주간 평균 목표 달성률</div>
                    <div className={`${styles.statChange} ${styles.positive}`}>7일 기준</div>
                </div>
                
                <div className={styles.statCard}>
                    <div className={`${styles.statNumber} ${styles.primary}`}>{stats.totalWeekRecords.toLocaleString()}개</div>
                    <div className={styles.statLabel}>주간 총 기록</div>
                    <div className={`${styles.statChange} ${styles.positive}`}>{stats.activeUsersInWeek}명 활동</div>
                </div>
                
                <div className={styles.statCard}>
                    <div className={`${styles.statNumber} ${styles.primary}`}>{Math.round(stats.averageWeeklyCalories).toLocaleString()}kcal</div>
                    <div className={styles.statLabel}>주간 평균 칼로리</div>
                    <div className={`${styles.statChange} ${styles.neutral}`}>1인당 평균</div>
                </div>
                
                <div className={styles.statCard}>
                    <div className={`${styles.statNumber} ${styles.primary}`}>{stats.mealCompletionRate.toFixed(1)}%</div>
                    <div className={styles.statLabel}>주간 식사 완성도</div>
                    <div className={`${styles.statChange} ${styles.positive}`}>{stats.totalMealTypes}개 식사타입 기준</div>
                </div>
            </div>

            <div className={styles.chartsGrid}>
                <div className={styles.chartSection}>
                    <h2 className={styles.chartTitle}>요일별 사용자 활동 분석</h2>
                    <div className={styles.chartContainer}>
                        <WeeklyUserActivity selectedDate={selectedDate} />
                    </div>
                </div>

                <div className={styles.chartSection}>
                    <h2 className={styles.chartTitle}>요일별 목표 달성자 분석</h2>
                    <div className={styles.chartContainer}>
                        <WeeklyGoalAchievers selectedDate={selectedDate} />
                    </div>
                </div>

                <div className={styles.chartSection}>
                    <h2 className={styles.chartTitle}>요일별 칼로리 추이</h2>
                    <div className={styles.chartContainer}>
                        <WeeklyCalorieTrend selectedDate={selectedDate} />
                    </div>
                </div>

                <div className={styles.chartSection}>
                    <h2 className={styles.chartTitle}>주간 인기 음식 TOP10</h2>
                    <div className={styles.chartContainer}>
                        <WeeklyPopularFoods selectedDate={selectedDate} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WeeklyTab;