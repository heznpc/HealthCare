import { Bar } from "react-chartjs-2";
import "../../css/DietDashboard.module.css";
import {  Chart as ChartJS,  CategoryScale,  LinearScale,  BarElement,  Title,  Tooltip,  Legend,} from "chart.js";

ChartJS.register(  CategoryScale,  LinearScale,  BarElement,  Title,  Tooltip,  Legend);


// 월간 탄단지 영양소 섭취량 평균

function MonthlyMacroAverage({ monthlyIntake, monthlyGoal }) {
    const data = {
        labels: ["탄수화물", "단백질", "지방"],
        datasets: [
          {
            label: "실제 섭취량",
            data: [monthlyIntake?.carb || 0, monthlyIntake?.protein || 0, monthlyIntake?.fat || 0],
            backgroundColor: "#3b82f6",
          },
          {
            label: "목표 섭취량",
            data: [monthlyGoal?.carb || 0, monthlyGoal?.protein || 0, monthlyGoal?.fat || 0],
            backgroundColor: "#56CCF2",
          },
        ],
      };
    
      const options = {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.raw.toLocaleString()} g`,
            },
          },
          title: {
            display: true,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "g (그램)",
            },
          },
        },
      };
    
      return (
        <div style={{ width: 900, height: 400 }}>
          <Bar data={data} options={options} />
        </div>
      );

}

export default MonthlyMacroAverage;