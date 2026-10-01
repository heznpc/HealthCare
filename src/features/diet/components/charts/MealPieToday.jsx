import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend
} from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

// 오늘 식사별 칼로리 파이차트
function MealPieToday({ date, records = [] }) {

  const grouped = records.reduce((acc, r) => {
    const key = r.mealType;
    const energy = Number(r.energy) || 0;
    acc[key] = (acc[key] || 0) + energy;            // 같은 mealType끼리 합산
    return acc;
  }, {});


  // labels / values 배열 만들기
  const labels = Object.keys(grouped);              // ["아침","점심","저녁"...]
  const values = labels.map(k => grouped[k]);       // [합산 kcal...]

      // 데이터 없으면 빈 상태
  if (values.length === 0) {
    return <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>오늘 식사 기록이 없습니다.</div>;
  }

  const data = {
    labels: labels,
    datasets: [{
      data: values,
      backgroundColor: ['#3b82f6','#2563eb','#1e40af', '#1d4ed8'],
      borderWidth: 0,
      hoverOffset: 6,
      spacing: 2,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed ?? 0;     // 도넛은 parsed가 숫자
            return `${value} kcal`;
          }
        }
      }
    },
  };

  return (
    <div style={{width: 500, height: 300}}>
      <Doughnut data={data} options={options} />
    </div>
  );
}

export default MealPieToday;