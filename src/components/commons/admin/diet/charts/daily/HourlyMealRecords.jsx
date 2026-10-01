// 시간별 식사기록 현황
import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from "chart.js";
import { storage } from "../../../../../../utils/storage";
import { filterUsers } from "../../utils/FilterUtils";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function HourlyMealRecords({ 
    selectedDate = new Date().toISOString().split('T')[0], 
    ageGroup = '전체', 
    gender = '전체'
}) {


    const { labels, recordCounts } = useMemo(() => {
        // 모든 활성 사용자 가져오기
        const allUsers = storage.getActiveUsers();
        const users = filterUsers(allUsers, ageGroup, gender);
        const dietRecords = storage.get('dietRecords') || {};
        
        // 24시간 배열 초기화 (0~23시)
        const hourlyData = Array(24).fill(0);
        
        users.forEach(user => {
            const userKey = user.userKey || user.id;
            const userRecords = dietRecords[userKey] || [];
            
            // 선택된 날짜 기록만 필터링
            const todayRecords = userRecords.filter(record => record.date === selectedDate);
            
            todayRecords.forEach(record => {
                const time = record.time;
                if (time) {
                    // "HH:MM" 형식에서 시간 추출
                    const match = time.match(/^(\d{1,2}):/);
                    if (match) {
                        const hour = parseInt(match[1], 10);
                        if (hour >= 0 && hour <= 23) {
                            hourlyData[hour]++;
                        }
                    }
                }
            });
        });

        // 라벨 생성 (00:00 ~ 23:00)
        const timeLabels = Array.from({ length: 24 }, (_, i) => 
            `${String(i).padStart(2, '0')}:00`
        );


        return {
            labels: timeLabels,
            recordCounts: hourlyData
        };
    }, [selectedDate, ageGroup, gender]);


    const data = {
        labels,
        datasets: [{
            label: '식사 기록 수',
            data: recordCounts,
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4, // 곡선 부드럽게
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: 'rgba(59, 130, 246, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
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
                        const hour = String(i).padStart(2, '0');
                        return `${hour}:00 ~ ${String((i + 1) % 24).padStart(2, '0')}:00`;
                    },
                    label: (ctx) => `식사 기록: ${ctx.parsed.y}건`,
                },
            },
        },
        scales: {
            x: {
                border: { display: true, dash: [3,3], color: "#666", width: 1 },
                title: {
                    display: true,
                    text: '시간대'
                },
                ticks: {
                    maxTicksLimit: 12, // 너무 많은 라벨 방지
                }
            },
            y: {
                beginAtZero: true,
                border: { display: true, dash: [3,3], color: "#666", width: 1 },
                ticks: { 
                    callback: (v) => `${v}건`,
                    stepSize: 1, // 정수 단위로 표시
                },
                title: {
                    display: true,
                    text: '기록 수'
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

export default HourlyMealRecords;