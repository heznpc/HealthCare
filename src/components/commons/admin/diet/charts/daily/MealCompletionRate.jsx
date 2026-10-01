// 끼니별 기록률 (관리자용 - 모든 사용자)
import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from "chart.js";
import { getMealTypes } from "../../utils/StatsCalculator";
import { calculateMealCompletionStats, getFilteredUsersAndRecords } from "../../utils/DataUtils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function MealCompletionRate({ 
    selectedDate = new Date().toISOString().split('T')[0], 
    ageGroup = '전체', 
    gender = '전체' 
}) {


    const { labels, completionRates, userCounts } = useMemo(() => {
        const { users, dietRecords } = getFilteredUsersAndRecords(ageGroup, gender);
        const mealStats = calculateMealCompletionStats(users, dietRecords, selectedDate);
        
        // 식사 타입을 정렬
        const sortedMealTypes = getMealTypes().sort((a, b) => {
            const order = ['아침', '점심', '저녁', '간식', '야식'];
            return order.indexOf(a) - order.indexOf(b) || a.localeCompare(b);
        });

        return {
            labels: sortedMealTypes,
            completionRates: sortedMealTypes.map(type => mealStats[type]?.rate || 0),
            userCounts: sortedMealTypes.map(type => mealStats[type]?.count || 0)
        };
    }, [selectedDate, ageGroup, gender]);


    const data = {
        labels,
        datasets: [{
          data: completionRates,
          backgroundColor: "rgba(59, 130, 246, 0.7)",
          borderRadius: 10,
          barThickness: "flex",
          maxBarThickness: 48,
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
                return labels[i] || '';
              },
              label: (ctx) => {
                const i = ctx.dataIndex;
                const rate = completionRates[i].toFixed(1);
                const count = userCounts[i];
                return [`기록률: ${rate}%`, `기록 사용자: ${count}명`];
              },
            },
          },
        },
        scales: {
          x: { 
            border: { display: true, dash: [3,3], color: "#666", width: 1 },
            title: {
              display: true,
              text: '식사 유형'
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            border: { display: true, dash: [3,3], color: "#666", width: 1 },
            ticks: { callback: (v) => `${v}%` },
            title: {
              display: true,
              text: '기록률 (%)'
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

export default MealCompletionRate;