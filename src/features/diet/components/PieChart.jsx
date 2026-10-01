import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import '../css/PieChart.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function PieChartSection({ data }) {
  const total = (data.carb || 0) + (data.protein || 0) + (data.fat || 0);

  const chartData = {
    labels: ['탄수화물', '단백질', '지방'],
    datasets: [
      {
        label: '영양소 비율 (g)',
        data: [data.carb || 0, data.protein || 0, data.fat || 0],
        backgroundColor: ['#36A2EB', '#7F56D9', '#FF7849'],
        borderWidth: 1,
      },
    ],
  };

  const formatNumber = (value, unit = '') =>
    `${Number(value || 0).toFixed(2)}${unit}`;

  return (
    <div className="piechart-wrap">
      {/* 파이차트 & 상세숫자 */}
      {total === 0 ? (
        <p className="no-data">⚠️ 분석할 데이터가 없습니다.</p>
      ) : (
        <>
          <h3 className="section-title">🥗 원형 섭취 비율</h3>
          <Pie data={chartData} />
        </>
      )}
      {/* 요약 카드 */}
      <div className="nutrition-summary">
        <h4>오늘의 영양 요약</h4>
        <div className="stat-grid">
          <div className="stat-card cal">
            <div className="stat-value">{formatNumber(data.cal)}</div>
            <div className="stat-label">총 칼로리</div>
          </div>
          <div className="stat-card carb">
            <div className="stat-value">{formatNumber(data.carb, 'g')}</div>
            <div className="stat-label">탄수화물</div>
          </div>
          <div className="stat-card protein">
            <div className="stat-value">{formatNumber(data.protein, 'g')}</div>
            <div className="stat-label">단백질</div>
          </div>
          <div className="stat-card fat">
            <div className="stat-value">{formatNumber(data.fat, 'g')}</div>
            <div className="stat-label">지방</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PieChartSection;
