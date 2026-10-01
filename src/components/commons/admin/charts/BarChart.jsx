import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import styles from './BarChart.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function BarChart({ data, title, options = {} }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { padding: 20, font: { size: 12 } }
      },
      title: { display: !!title, text: title, font: { size: 16, weight: 'bold' } },
      tooltip: {
        callbacks: {
          label(context) {
            const value = context.parsed.y;
            const label = context.dataset.label || '';
            return `${label}: ${value}명`;
          }
        }
      }
    },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className={styles.barChartContainer}>
      <div className={styles.chartWrapper}>
        <Bar data={data} options={mergedOptions} />
      </div>
    </div>
  );
}

export default BarChart;
