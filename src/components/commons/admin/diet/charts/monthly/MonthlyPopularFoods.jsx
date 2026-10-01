// 월간 인기 음식 TOP10
import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from "chart.js";
import { storage } from "../../../../../../utils/storage";
import { filterUsers } from "../../utils/FilterUtils";
import { getMonthDates } from "../../utils/StatsCalculator";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function MonthlyPopularFoods({ 
    selectedDate = new Date().toISOString().split('T')[0],
    ageGroup = '전체', 
    gender = '전체'
}) {



    const { labels, counts } = useMemo(() => {
        // 모든 활성 사용자 가져오기
        const allUsers = storage.getActiveUsers();
        const users = filterUsers(allUsers, ageGroup, gender);
        const dietRecords = storage.get('dietRecords') || {};
        
        // 선택된 날짜의 월 정보 가져오기
        const monthDates = getMonthDates(selectedDate);
        
        // 음식 카운트 맵
        const foodCounts = {};
        
        users.forEach(user => {
            const userKey = user.userKey || user.id;
            const userRecords = dietRecords[userKey] || [];
            
            // 월간 기록만 필터링
            const monthRecords = userRecords.filter(record => 
                monthDates.includes(record.date)
            );
            
            monthRecords.forEach(record => {
                const foodName = record.foodName || record.name;
                if (foodName) {
                    const quantity = Number(record.quantity) || 1;
                    foodCounts[foodName] = (foodCounts[foodName] || 0) + quantity;
                }
            });
        });

        // 카운트 순으로 정렬하고 TOP 10만 선택
        const sortedFoods = Object.entries(foodCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        return {
            labels: sortedFoods.map(([name]) => name),
            counts: sortedFoods.map(([, count]) => count)
        };
    }, [selectedDate, ageGroup, gender]);

    // 데이터 없으면 빈 상태
    if (labels.length === 0) {
        return <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>월간 식사 기록이 없습니다.</div>;
    }

    // 청사과 색 계열 그라데이션 생성 (1위가 가장 진하고 10위로 갈수록 연해짐)
    const generateColors = (count) => {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const intensity = 1 - (i / count) * 0.7; // 1.0에서 0.3까지
            const backgroundColor = `rgba(59, 130, 246, ${intensity})`;
            const borderColor = `rgba(59, 130, 246, ${Math.min(intensity + 0.2, 1)})`;
            colors.push({ backgroundColor, borderColor });
        }
        return colors;
    };

    const colorData = generateColors(labels.length);

    const data = {
        labels,
        datasets: [{
            data: counts,
            backgroundColor: colorData.map(c => c.backgroundColor),
            borderColor: colorData.map(c => c.borderColor),
            borderWidth: 1,
        }],
    };

    const options = {
        indexAxis: 'y', // 가로 바 차트
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: (items) => {
                        const i = items?.[0]?.dataIndex ?? 0;
                        return labels[i] || '';
                    },
                    label: (ctx) => `섭취 횟수: ${ctx.parsed.x}회 (월간)`,
                },
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                border: { display: true, dash: [3,3], color: "#666", width: 1 },
                ticks: { callback: (v) => `${v}회` },
                title: {
                    display: true,
                    text: '섭취 횟수 (월간)'
                }
            },
            y: {
                border: { display: true, dash: [3,3], color: "#666", width: 1 },
                title: {
                    display: true,
                    text: '음식명'
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

export default MonthlyPopularFoods;