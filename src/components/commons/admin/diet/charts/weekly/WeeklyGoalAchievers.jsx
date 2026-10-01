// 요일별 목표 달성자 분석
import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from "chart.js";
import { storage } from "../../../../../../utils/storage";
import { aggregate, calculateNutritionTargets } from "../../../../../../features/diet/utils/NutritionUtils";
import { filterUsers } from "../../utils/FilterUtils";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function WeeklyGoalAchievers({ 
    selectedDate = new Date().toISOString().split('T')[0],
    ageGroup = '전체', 
    gender = '전체' 
}) {


    const { labels, achieverCounts, totalUserCounts } = useMemo(() => {
        // 모든 활성 사용자 가져오기
        const allUsers = storage.getActiveUsers();
        const users = filterUsers(allUsers, ageGroup, gender);
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
        
        const dayLabels = ['월', '화', '수', '목', '금', '토', '일'];
        const dailyAchievers = Array(7).fill(0);
        const dailyTotals = Array(7).fill(0);
        
        // 각 요일별 목표 달성자 수 계산
        weekDates.forEach((date, dayIndex) => {
            users.forEach(user => {
                const userKey = user.userKey || user.id;
                const userRecords = dietRecords[userKey] || [];
                
                const dayRecords = userRecords.filter(record => record.date === date);
                if (dayRecords.length > 0) {
                    dailyTotals[dayIndex]++;
                    
                    // 목표 달성 여부 확인
                    const dayCalories = aggregate(dayRecords).cal;
                    const nutritionTargets = calculateNutritionTargets(user);
                    
                    if (nutritionTargets && nutritionTargets.cal > 0) {
                        const achievementRate = (dayCalories / nutritionTargets.cal) * 100;
                        if (achievementRate >= 80) { // 80% 이상 달성 시 목표 달성으로 간주
                            dailyAchievers[dayIndex]++;
                        }
                    }
                }
            });
        });

        return {
            labels: dayLabels,
            achieverCounts: dailyAchievers,
            totalUserCounts: dailyTotals
        };
    }, [selectedDate, ageGroup, gender]);

    const data = {
        labels,
        datasets: [
            {
                label: '목표 달성자',
                data: achieverCounts,
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: 'rgba(59, 130, 246, 1)',
                pointRadius: 5,
                pointHoverRadius: 8,
            },
            {
                label: '전체 활성 사용자',
                data: totalUserCounts,
                borderColor: 'rgba(59, 130, 246, 0.5)',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointBackgroundColor: 'rgba(59, 130, 246, 0.5)',
                pointBorderColor: 'rgba(59, 130, 246, 0.5)',
                pointRadius: 4,
                pointHoverRadius: 7,
                borderDash: [5, 5],
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
                        return `${labels[i]}요일`;
                    },
                    label: (ctx) => {
                        const total = totalUserCounts[ctx.dataIndex];
                        const achievers = achieverCounts[ctx.dataIndex];
                        const rate = total > 0 ? ((achievers / total) * 100).toFixed(1) : 0;
                        
                        if (ctx.datasetIndex === 0) {
                            return `목표 달성자: ${ctx.parsed.y}명 (${rate}%)`;
                        } else {
                            return `전체 활성 사용자: ${ctx.parsed.y}명`;
                        }
                    },
                },
            },
        },
        scales: {
            x: {
                border: { display: true, dash: [3,3], color: "#666", width: 1 },
                title: {
                    display: true,
                    text: '요일'
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

export default WeeklyGoalAchievers;