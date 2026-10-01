// 월간 주차별 목표 달성률
import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from "chart.js";
import { storage } from "../../../../../../utils/storage";
import { aggregate, calculateNutritionTargets } from "../../../../../../features/diet/utils/NutritionUtils";
import { filterUsers } from "../../utils/FilterUtils";
import { getMonthDates } from "../../utils/StatsCalculator";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function MonthlyWeeklyGoals({ 
    selectedDate = new Date().toISOString().split('T')[0],
    ageGroup = '전체', 
    gender = '전체' 
}) {


    const { labels, achievementRates, userCounts } = useMemo(() => {
        // 모든 활성 사용자 가져오기
        const allUsers = storage.getActiveUsers();
        const users = filterUsers(allUsers, ageGroup, gender);
        const dietRecords = storage.get('dietRecords') || {};
        
        // 선택된 날짜의 월 정보 가져오기
        const monthDates = getMonthDates(selectedDate);
        const selectedDateObj = new Date(selectedDate);
        const year = selectedDateObj.getFullYear();
        const month = selectedDateObj.getMonth();
        
        // 해당 월의 주차별 범위 계산
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const weeks = [];
        let currentWeekStart = new Date(firstDay);
        let weekNumber = 1;
        
        while (currentWeekStart <= lastDay) {
            const currentWeekEnd = new Date(currentWeekStart);
            currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
            
            // 월의 마지막 날을 넘어가면 조정
            if (currentWeekEnd > lastDay) {
                currentWeekEnd.setTime(lastDay.getTime());
            }
            
            weeks.push({
                label: `${weekNumber}주차`,
                start: currentWeekStart.toISOString().split('T')[0],
                end: currentWeekEnd.toISOString().split('T')[0]
            });
            
            currentWeekStart = new Date(currentWeekEnd);
            currentWeekStart.setDate(currentWeekEnd.getDate() + 1);
            weekNumber++;
            
            // 다음 주 시작이 다음 달이면 중단
            if (currentWeekStart.getMonth() !== month) {
                break;
            }
        }
        
        const weeklyRates = [];
        const weeklyCounts = [];
        
        // 각 주차별 목표 달성률 계산
        weeks.forEach(week => {
            let totalAchievement = 0;
            let validUsers = 0;
            
            users.forEach(user => {
                const userKey = user.userKey || user.id;
                const userRecords = dietRecords[userKey] || [];
                
                // 해당 주차 기록 필터링
                const weekRecords = userRecords.filter(record => 
                    record.date >= week.start && record.date <= week.end
                );
                
                if (weekRecords.length > 0) {
                    const weekCalories = aggregate(weekRecords).cal;
                    const nutritionTargets = calculateNutritionTargets(user);
                    
                    if (nutritionTargets && nutritionTargets.cal > 0) {
                        // 해당 주차의 일수 계산
                        const weekStartDate = new Date(week.start);
                        const weekEndDate = new Date(week.end);
                        const daysInWeek = Math.ceil((weekEndDate - weekStartDate) / (1000 * 60 * 60 * 24)) + 1;
                        
                        const weekTargetCalories = nutritionTargets.cal * daysInWeek;
                        const achievementRate = (weekCalories / weekTargetCalories) * 100;
                        
                        totalAchievement += Math.min(achievementRate, 100);
                        validUsers++;
                    }
                }
            });
            
            weeklyRates.push(validUsers > 0 ? totalAchievement / validUsers : 0);
            weeklyCounts.push(validUsers);
        });

        return {
            labels: weeks.map(week => week.label),
            achievementRates: weeklyRates,
            userCounts: weeklyCounts
        };
    }, [selectedDate, ageGroup, gender]);

    const data = {
        labels,
        datasets: [{
            label: '평균 목표 달성률',
            data: achievementRates,
            backgroundColor: "rgba(59, 130, 246, 0.7)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 1,
            borderRadius: 8,
        }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: (items) => {
                        const i = items?.[0]?.dataIndex ?? 0;
                        return labels[i];
                    },
                    label: (ctx) => {
                        const rate = ctx.parsed.y.toFixed(1);
                        const users = userCounts[ctx.dataIndex];
                        return [`목표 달성률: ${rate}%`, `활성 사용자: ${users}명`];
                    },
                },
            },
        },
        scales: {
            x: {
                border: { display: true, dash: [3,3], color: "#666", width: 1 },
                title: {
                    display: true,
                    text: '주차'
                }
            },
            y: {
                beginAtZero: true,
                max: 100,
                border: { display: true, dash: [3,3], color: "#666", width: 1 },
                ticks: { 
                    callback: (v) => `${v}%`,
                },
                title: {
                    display: true,
                    text: '평균 달성률 (%)'
                }
            },
        },
    };

    return (
        <div style={{ width: "100%", height: 400 }}>
            <Bar data={data} options={options} />
        </div>
    );
}

export default MonthlyWeeklyGoals;