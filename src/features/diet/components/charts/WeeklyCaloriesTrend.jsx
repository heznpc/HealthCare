// 주간 칼로리 추이
import { Line } from "react-chartjs-2";
import "../../css/DietDashboard.module.css";
import {  Chart as ChartJS,  CategoryScale,  LinearScale,  PointElement,  LineElement,  Title,  Tooltip,  Legend, } from "chart.js";
ChartJS.register(  CategoryScale,  LinearScale,  PointElement,  LineElement,  Title,  Tooltip,  Legend);


function WeeklyCaloriesTrend({weeklyByDay}) {

  // weeklyByDay에서 요일별 칼로리 데이터 추출
  const labels = weeklyByDay?.map(day => day.dayName) || ["월", "화", "수", "목", "금", "토", "일"];
  const calorieData = weeklyByDay?.map(day => Math.round(day.cal)) || [];

  const data = {
    labels: labels,
    datasets: [
      {
        label: "섭취 칼로리(kcal)",  // 선 설명
        data: calorieData,           // weeklyByDay에서 추출한 칼로리 데이터
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
          label: (ctx) => `${ctx.parsed.y} kcal`, // 툴팁에 kcal 붙이기
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
          callback: (v) => `${v} kcal`,
        },
      },
    },
  };

  return (
    <div style={{ width: "900px", height: "400px" }}>
      <Line data={data} options={options} />
    </div>
  );
}

export default WeeklyCaloriesTrend;
