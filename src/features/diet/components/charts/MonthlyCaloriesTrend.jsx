import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

// 월간 칼로리 추이

function MonthlyCaloriesTrend({ daily = [] }) {

    // 주차별 데이터 그룹화
    const groupByWeeks = (dailyData) => {
        if (!dailyData || dailyData.length === 0) return [];
        
        const weeklyGroups = {};
        
        dailyData.forEach(day => {
            if (!day.date) return;
            
            const date = new Date(day.date);
            const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const dayOfMonth = date.getDate();
            
            // 해당 월의 첫 번째 주의 시작일 (월요일 기준)
            const firstWeekStart = new Date(firstDayOfMonth);
            const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7; // 월=0, 일=6
            firstWeekStart.setDate(1 - firstDayWeekday);
            
            // 현재 날짜가 몇 번째 주인지 계산
            const weekNumber = Math.floor((date - firstWeekStart) / (7 * 24 * 60 * 60 * 1000)) + 1;
            
            if (!weeklyGroups[weekNumber]) {
                weeklyGroups[weekNumber] = { totalCalories: 0, days: [] };
            }
            
            weeklyGroups[weekNumber].totalCalories += (day.cal || 0);
            weeklyGroups[weekNumber].days.push(day);
        });
        
        return Object.keys(weeklyGroups)
            .sort((a, b) => Number(a) - Number(b))
            .map(weekNum => weeklyGroups[weekNum]);
    };

    const weeklyData = groupByWeeks(daily);
    const chartLabels = weeklyData.map((_, index) => `${index + 1}주차`);
    const chartData = weeklyData.map(week => week.totalCalories);

    const data = {
        labels: chartLabels,
        datasets: [
        {
            label: "섭취 칼로리(kcal)",  // 선 설명
            data: chartData,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59,130,246,0.2)",
            tension: 0.3,                // 곡선 부드럽게
            fill: true,                  // 아래 영역 채우기
            pointRadius: 5,              // 점 크기
            pointHoverRadius: 7,         // hover시 점 크기
        },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
        legend: { position: "top" },
        tooltip: {
            callbacks: {
            label: (ctx) => `${ctx.parsed.y.toLocaleString()} kcal`, // 툴팁에 1000단위 구분자와 kcal 붙이기
            },
        },
        },
        scales: {
        x: {
            title: { display: true },
        },
        y: {
            beginAtZero: true,
            title: { display: true },
            ticks: {
            callback: (v) => `${v.toLocaleString()} kcal`,
            },
        },
        },
    };

    return (
        <div style={{width: "900px", height: "400px" }}>
        <Line data={data} options={options} />
        </div>
    );

}

export default MonthlyCaloriesTrend;