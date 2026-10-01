// 월간 칼로리 분포 변화
import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from "chart.js";
import { storage } from "../../../../../../utils/storage";
import { aggregate } from "../../../../../../features/diet/utils/NutritionUtils";
import { filterUsers } from "../../utils/FilterUtils";
import { MONTHLY_CALORIE_RANGES } from "../../utils/CalorieRanges";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function MonthlyCalorieDistribution({ 
    selectedDate = new Date().toISOString().split('T')[0],
    ageGroup = '전체', 
    gender = '전체'
}) {



    const { labels, lowCalorie, midCalorie, highCalorie } = useMemo(() => {
        // 모든 활성 사용자 가져오기
        const allUsers = storage.getActiveUsers();
        const users = filterUsers(allUsers, ageGroup, gender);
        const dietRecords = storage.get('dietRecords') || {};
        
        // 선택된 날짜의 월 정보 가져오기
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
            
            if (currentWeekStart.getMonth() !== month) {
                break;
            }
        }
        
        // 칼로리 구간 사용
        
        const weeklyLow = [];
        const weeklyMid = [];
        const weeklyHigh = [];
        
        // 각 주차별 칼로리 분포 계산
        weeks.forEach(week => {
            let lowCount = 0;
            let midCount = 0;
            let highCount = 0;
            
            users.forEach(user => {
                const userKey = user.userKey || user.id;
                const userRecords = dietRecords[userKey] || [];
                
                // 해당 주차 기록 필터링
                const weekRecords = userRecords.filter(record => 
                    record.date >= week.start && record.date <= week.end
                );
                
                if (weekRecords.length > 0) {
                    // 주간 일평균 칼로리 계산
                    const weekCalories = aggregate(weekRecords).cal;
                    const weekStartDate = new Date(week.start);
                    const weekEndDate = new Date(week.end);
                    const daysInWeek = Math.ceil((weekEndDate - weekStartDate) / (1000 * 60 * 60 * 24)) + 1;
                    const avgDailyCalories = weekCalories / daysInWeek;
                    
                    if (avgDailyCalories < MONTHLY_CALORIE_RANGES.mid.min) {
                        lowCount++;
                    } else if (avgDailyCalories < MONTHLY_CALORIE_RANGES.high.min) {
                        midCount++;
                    } else {
                        highCount++;
                    }
                }
            });
            
            weeklyLow.push(lowCount);
            weeklyMid.push(midCount);
            weeklyHigh.push(highCount);
        });

        return {
            labels: weeks.map(week => week.label),
            lowCalorie: weeklyLow,
            midCalorie: weeklyMid,
            highCalorie: weeklyHigh
        };
    }, [selectedDate, ageGroup, gender]);

    const data = {
        labels,
        datasets: [
            {
                label: MONTHLY_CALORIE_RANGES.low.label,
                data: lowCalorie,
                borderColor: MONTHLY_CALORIE_RANGES.low.color,
                backgroundColor: MONTHLY_CALORIE_RANGES.low.color.replace('1)', '0.1)'),
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointBackgroundColor: MONTHLY_CALORIE_RANGES.low.color,
                pointBorderColor: MONTHLY_CALORIE_RANGES.low.color,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
            {
                label: MONTHLY_CALORIE_RANGES.mid.label,
                data: midCalorie,
                borderColor: MONTHLY_CALORIE_RANGES.mid.color,
                backgroundColor: MONTHLY_CALORIE_RANGES.mid.color.replace('1)', '0.1)'),
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointBackgroundColor: MONTHLY_CALORIE_RANGES.mid.color,
                pointBorderColor: MONTHLY_CALORIE_RANGES.mid.color,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
            {
                label: MONTHLY_CALORIE_RANGES.high.label,
                data: highCalorie,
                borderColor: MONTHLY_CALORIE_RANGES.high.color,
                backgroundColor: MONTHLY_CALORIE_RANGES.high.color.replace('1)', '0.1)'),
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointBackgroundColor: MONTHLY_CALORIE_RANGES.high.color,
                pointBorderColor: MONTHLY_CALORIE_RANGES.high.color,
                pointRadius: 4,
                pointHoverRadius: 6,
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                display: true,
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    title: (items) => {
                        const i = items?.[0]?.dataIndex ?? 0;
                        return labels[i];
                    },
                    label: (ctx) => {
                        return `${ctx.dataset.label}: ${ctx.parsed.y}명`;
                    },
                    footer: (items) => {
                        const i = items?.[0]?.dataIndex ?? 0;
                        const total = lowCalorie[i] + midCalorie[i] + highCalorie[i];
                        return `총 활성 사용자: ${total}명`;
                    }
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
                border: { display: true, dash: [3,3], color: "#666", width: 1 },
                ticks: { 
                    callback: (v) => `${v}명`,
                    stepSize: 1,
                },
                title: {
                    display: true,
                    text: '사용자 수'
                }
            },
        },
    };

    return (
        <div style={{ width: "100%", height: 400 }}>
            <Line data={data} options={options} />
        </div>
    );
}

export default MonthlyCalorieDistribution;