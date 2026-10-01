import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// 숫자 2자리 문자열 만들기
const pad = (n) => String(n).padStart(2, "0");

function DailyBarByTime({ date, records = [] }) {
  const { labels, values, activeHours } = useMemo(() => {
    const bins = Array(24).fill(0);

    // 해당 날짜만 집계 (에너지×수량 합)
    for (const r of records) {
      if (r?.date !== date || !r?.time) continue;
      const m = String(r.time).match(/^(\d{1,2}):/);
      const h = m ? Math.min(23, Math.max(0, parseInt(m[1], 10))) : 0;
      const q = Number(r.quantity) || 1;
      const cal = Number(r.energy) || 0;
      bins[h] += cal * q;
    }

    // 0인 시간대 제거
    const active = bins
      .map((v, h) => ({ h, v }))
      .filter(({ v }) => v > 0);

    return {
      labels: active.map(({ h }) => `${pad(h)}:00`),
      values: active.map(({ v }) => v),
      activeHours: active.map(({ h }) => h), // 툴팁용 실제 시간
    };
  }, [records, date]);

  // 데이터 없으면 빈 상태
  if (values.length === 0) {
    return <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>오늘 식사 기록이 없습니다.</div>;
  }

  const data = {
    labels,
    datasets: [{
      data: values,
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
            const h = activeHours[i] ?? 0;
            return `${pad(h)}:00–${pad((h + 1) % 24)}:00`;
          },
          label: (ctx) => `${Math.round(ctx.parsed.y)} kcal`,
        },
      },
    },
    scales: {
      x: { border: { display: true, dash: [3,3], color: "#666", width: 1 } },
      y: {
        beginAtZero: true,
        border: { display: true, dash: [3,3], color: "#666", width: 1 },
        ticks: { callback: (v) => `${v} kcal` },
      },
    },
  };

  return (
    <div style={{ width: "500px", height: 300 }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export default DailyBarByTime;

