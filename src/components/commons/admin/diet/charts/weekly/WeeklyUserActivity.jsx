// 요일별 사용자 활동 분석
import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from "chart.js";
import { storage } from "../../../../../../utils/storage";
import { filterUsers } from "../../utils/FilterUtils";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function WeeklyUserActivity({ 
    selectedDate = new Date().toISOString().split('T')[0],
    ageGroup = '전체', 
    gender = '전체'
}) {


    const { labels, userCounts } = useMemo(() => {
        // 모든 활성 사용자 가져오기
        const allUsers = storage.getActiveUsers();
        const users = filterUsers(allUsers, ageGroup, gender);
        const dietRecords = storage.get('dietRecords') || {};
        
        // 선택된 날짜로부터 주간 범위 계산 (월요일 시작)
        const selectedDateObj = new Date(selectedDate);
        const dayOfWeek = selectedDateObj.getDay(); // 0=일요일, 1=월요일, ...
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 월요일까지의 오프셋
        
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(selectedDateObj);
            date.setDate(selectedDateObj.getDate() + mondayOffset + i);
            weekDates.push(date.toISOString().split('T')[0]);
        }
        
        const dayLabels = ['월', '화', '수', '목', '금', '토', '일'];
        const dailyCounts = Array(7).fill(0);
        
        // 각 요일별 활성 사용자 수 계산
        weekDates.forEach((date, dayIndex) => {
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
            label: '활성 사용자 수',
            data: userCounts,
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: 'rgba(59, 130, 246, 1)',
            pointRadius: 5,
            pointHoverRadius: 8,
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
                        return `${labels[i]}요일`;
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

export default WeeklyUserActivity;