// 월간 일별 활동 추이
import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from "chart.js";
import { storage } from "../../../../../../utils/storage";
import { filterUsers } from "../../utils/FilterUtils";
import { getMonthDates } from "../../utils/StatsCalculator";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function MonthlyDailyActivity({ 
    selectedDate = new Date().toISOString().split('T')[0],
    ageGroup = '전체', 
    gender = '전체' 
}) {



    const { labels, userCounts } = useMemo(() => {
        // 모든 활성 사용자 가져오기
        const allUsers = storage.getActiveUsers();
        const users = filterUsers(allUsers, ageGroup, gender);
        const dietRecords = storage.get('dietRecords') || {};
        
        // 해당 월의 모든 날짜 생성
        const monthDates = getMonthDates(selectedDate);
        const dayLabels = monthDates.map((_, index) => `${index + 1}`);
        
        const dailyCounts = Array(monthDates.length).fill(0);
        
        // 각 날짜별 활성 사용자 수 계산
        monthDates.forEach((date, dayIndex) => {
            users.forEach(user => {
                const userKey = user.userKey || user.id;
                const userRecords = dietRecords[userKey] || [];
                
                const hasRecordOnDate = userRecords.some(record => record.date === date);
                if (hasRecordOnDate) {
                    dailyCounts[dayIndex]++;
                }
            });
        });

        return {
            labels: dayLabels,
            userCounts: dailyCounts
        };
    }, [selectedDate, ageGroup, gender]);

    const data = {
        labels,
        datasets: [{
            label: '일별 활성 사용자',
            data: userCounts,
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: 'rgba(59, 130, 246, 1)',
            pointRadius: 3,
            pointHoverRadius: 5,
        }],
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
                        const selectedDateObj = new Date(selectedDate);
                        const year = selectedDateObj.getFullYear();
                        const month = selectedDateObj.getMonth() + 1;
                        return `${year}년 ${month}월 ${labels[i]}일`;
                    },
                    label: (ctx) => `활성 사용자: ${ctx.parsed.y}명`,
                },
            },
        },
        scales: {
            x: {
                border: { display: true, dash: [3,3], color: "#666", width: 1 },
                title: {
                    display: true,
                    text: '일(Day)'
                },
                ticks: {
                    maxTicksLimit: 15, // 너무 많은 라벨 방지
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
                    text: '활성 사용자 수'
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

export default MonthlyDailyActivity;