import React, { useMemo, useState } from "react";
import MealCompletionRate from "../charts/daily/MealCompletionRate";
import { storage } from "../../../../../utils/storage";
import { aggregate, calculateNutritionTargets } from "../../../../../features/diet/utils/NutritionUtils";
import CalorieDistribution from "../charts/daily/CalorieDistribution";
import TodaysPopularFoods from "../charts/daily/TodaysPopularFoods";
import HourlyMealRecords from "../charts/daily/HourlyMealRecords";
import styles from "../css/Dashboard.module.css";


function DailyTab() {
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
        
        // 전체 시스템에서 사용되는 모든 식사 타입 수집
        const allMealTypes = new Set();
        const dietRecords = storage.get('dietRecords') || {};
        
        // 전체 시스템에서 사용되는 모든 식사 타입 수집
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
        
        // 오늘 날짜의 식단 데이터 수집
        let totalRecords = 0;
        let totalCalories = 0;
        let totalGoalAchievement = 0;
        let completedMealSlots = 0;
        let totalMealSlots = 0;
        let validUsersCount = 0;

        users.forEach(user => {
            const userKey = user.userKey || user.id;
            const userRecords = dietRecords[userKey] || [];
            
            // 선택된 날짜 기록만 필터링
            const todayRecords = userRecords.filter(record => record.date === selectedDate);
            
            if (todayRecords.length > 0) {
                totalRecords += todayRecords.length;
                
                // 칼로리 합계
                const dayCalories = aggregate(todayRecords).cal;
                totalCalories += dayCalories;
                
                // 목표 달성률 계산
                const nutritionTargets = calculateNutritionTargets(user);
                if (nutritionTargets && nutritionTargets.cal > 0) {
                    const achievementRate = (dayCalories / nutritionTargets.cal) * 100;
                    totalGoalAchievement += Math.min(achievementRate, 100);
                    validUsersCount++;
                }
            }
            
            // 식사 완성도 계산 (동적 meal type 사용)
            mealTypesArray.forEach(mealType => {
                const mealRecords = todayRecords.filter(record => record.mealType === mealType);
                if (mealRecords.length > 0) {
                    completedMealSlots++;
                }
                totalMealSlots++;
            });
        });

        const activeUsersToday = users.filter(user => {
            const userKey = user.userKey || user.id;
            const userRecords = dietRecords[userKey] || [];
            return userRecords.some(record => record.date === selectedDate);
        }).length;

        return {
            averageGoalAchievement: validUsersCount > 0 ? (totalGoalAchievement / validUsersCount) : 0,
            totalTodayRecords: totalRecords,
            averageCalories: activeUsersToday > 0 ? (totalCalories / activeUsersToday) : 0,
            mealCompletionRate: totalMealSlots > 0 ? (completedMealSlots / totalMealSlots) * 100 : 0,
            activeUsersToday,
            totalMealTypes: mealTypesArray.length
        };
    }, [selectedDate, ageGroup, gender]);

    return(
        <div className={styles.dailyTabWrap}>
            <div className={styles.dateSelector}>
                <label htmlFor="date-picker" className={styles.dateLabel}>날짜 선택:</label>
                <input
                    id="date-picker"
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
            </div>
            
            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.success}`}>
                    <div className={`${styles.statNumber} ${styles.success}`}>{stats.averageGoalAchievement.toFixed(1)}%</div>
                    <div className={styles.statLabel}>평균 목표 달성률</div>
                    <div className={`${styles.statChange} ${styles.positive}`}>{selectedDate} 기준</div>
                </div>
                
                <div className={styles.statCard}>
                    <div className={`${styles.statNumber} ${styles.primary}`}>{stats.totalTodayRecords.toLocaleString()}개</div>
                    <div className={styles.statLabel}>오늘 기록 완료</div>
                    <div className={`${styles.statChange} ${styles.positive}`}>{stats.activeUsersToday}명 활동</div>
                </div>
                
                <div className={styles.statCard}>
                    <div className={`${styles.statNumber} ${styles.primary}`}>{Math.round(stats.averageCalories).toLocaleString()}kcal</div>
                    <div className={styles.statLabel}>평균 섭취 칼로리</div>
                    <div className={`${styles.statChange} ${styles.neutral}`}>전체 평균</div>
                </div>
                
                <div className={styles.statCard}>
                    <div className={`${styles.statNumber} ${styles.primary}`}>{stats.mealCompletionRate.toFixed(1)}%</div>
                    <div className={styles.statLabel}>식사 기록 완성도</div>
                    <div className={`${styles.statChange} ${styles.positive}`}>{stats.totalMealTypes}개 식사타입 기준</div>
                </div>
            </div>

            <div className={styles.chartsGrid}>
                <div className={styles.chartSection}>
                    <h2 className={styles.chartTitle}>일간 사용자 끼니별 기록률</h2>
                    <div className={styles.chartContainer}>
                        <MealCompletionRate 
                            selectedDate={selectedDate} 
                            ageGroup={ageGroup} 
                            gender={gender} 
                        />
                    </div>
                </div>

                <div className={styles.chartSection}>
                    <h2 className={styles.chartTitle}>일간 사용자 섭취 칼로리 현황</h2>
                    <div className={styles.chartContainer}>
                        <CalorieDistribution 
                            selectedDate={selectedDate} 
                            ageGroup={ageGroup} 
                            gender={gender} 
                        />
                    </div>
                </div>

                <div className={styles.chartSection}>
                    <h2 className={styles.chartTitle}>일간 사용자 시간별 식사 현황</h2>
                    <div className={styles.chartContainer}>
                        <HourlyMealRecords 
                            selectedDate={selectedDate} 
                            ageGroup={ageGroup} 
                            gender={gender} 
                        />
                    </div>
                </div>

                <div className={styles.chartSection}>
                    <h2 className={styles.chartTitle}>인기 음식 TOP10</h2>
                    <div className={styles.chartContainer}>
                        <TodaysPopularFoods 
                            selectedDate={selectedDate} 
                            ageGroup={ageGroup} 
                            gender={gender} 
                        />
                    </div>
                </div>
            </div>
        </div>

    );


}

export default DailyTab;