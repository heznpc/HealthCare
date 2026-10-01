// 칼로리 섭취 분포도(바차트)
import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from "chart.js";

import { storage } from "utils/storage";
import { aggregate } from "features/diet/utils/DataAggregator";
import { filterUsers } from "../../utils/FilterUtils";
import { DAILY_CALORIE_RANGES } from "../../utils/CalorieRanges";
import { createBarChartOptions, TOOLTIP_CALLBACKS } from "../../utils/ChartOptions";


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function CalorieDistribution({ 
    selectedDate = new Date().toISOString().split('T')[0], 
    ageGroup = '전체', 
    gender = '전체'
}) {

    
    const { labels, userCounts } = useMemo(() => {
        // 모든 활성 사용자 가져오기
        const allUsers = storage.getActiveUsers();
        const users = filterUsers(allUsers, ageGroup, gender);
        const dietRecords = storage.get('dietRecords') || {};
        
        // 칼로리 구간별 사용자 수 계산
        const rangeCounts = DAILY_CALORIE_RANGES.map(() => 0);
        
        users.forEach(user => {
            const userKey = user.userKey || user.id;
            const userRecords = dietRecords[userKey] || [];
            
            // 선택된 날짜 기록만 필터링
            const todayRecords = userRecords.filter(record => record.date === selectedDate);
            
            if (todayRecords.length > 0) {
                // 오늘 총 칼로리 계산
                const totalCalories = aggregate(todayRecords).cal;
                
                // 해당하는 칼로리 구간 찾기
                const rangeIndex = DAILY_CALORIE_RANGES.findIndex(range => 
                    totalCalories >= range.min && totalCalories < range.max
                );
                
                if (rangeIndex !== -1) {
                    rangeCounts[rangeIndex]++;
                }
            }
        });
        
        return {
            labels: DAILY_CALORIE_RANGES.map(range => range.label),
            userCounts: rangeCounts
        };
    }, [selectedDate, ageGroup, gender]);
    
    
    const data = {
        labels,
        datasets: [{
            data: userCounts,
            backgroundColor: "rgba(59, 130, 246, 0.7)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 1,
            borderRadius: 8,
            barThickness: "flex",
            maxBarThickness: 60,
        }],
    };
    
    const options = {
        ...createBarChartOptions('칼로리 구간', '사용자 수', '명'),
        plugins: {
            ...createBarChartOptions('칼로리 구간', '사용자 수', '명').plugins,
            tooltip: {
                callbacks: {
                    title: TOOLTIP_CALLBACKS.defaultTitle,
                    label: TOOLTIP_CALLBACKS.userCount,
                },
            },
        },
    };
        
          return (
            <div style={{ width: "100%", height: 400 }}>
              <Bar data={data} options={options} />
            </div>
          );
}

export default CalorieDistribution;