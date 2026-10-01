// src/features/dashboard/components/AnalyticsPanel.jsx
import React, { useMemo, useState } from "react";
import { storage } from "utils/storage";
import styles from "./css/AnalyticsPanel.module.css";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Tooltip, Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

// ---- date utils ----
const toISO = (d) => {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeekMon = (d) => {
  const x = new Date(d); const day = (x.getDay() + 6) % 7; // Mon=0
  x.setDate(x.getDate() - day); x.setHours(0,0,0,0); return x;
};
const ym = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;

// ---- parse utils ----
const toNum = (v) => {
  if (v == null) return 0;
  if (typeof v === "number") return isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g,"").trim());
    return isFinite(n) ? n : 0;
  }
  return 0;
};

// ---- user + records (정확 매칭만 허용) ----
const getUserKey = () => {
  const a = storage.get("currentAuth");
  return a?.userKey || a?.username || a?.id || a?.userId || "guest";
};

/**
 * 사용자 격리:
 * - 객체 저장형: 해당 key만 반환. 없으면 빈 배열.
 * - 레거시 배열형: 게스트일 때만 허용. 비게스트면 빈 배열.
 * - 그 외: 빈 배열.
 */
const getRecordsStrict = (bucket, key) => {
  if (!bucket) return [];
  if (Array.isArray(bucket)) {
    return key === "guest" ? bucket : [];
  }
  if (typeof bucket === "object") {
    return Array.isArray(bucket[key]) ? bucket[key] : [];
  }
  return [];
};

export default function AnalyticsPanel() {
  // 기본 기간: 오늘~7일 전
  const today = useMemo(() => { const t=new Date(); t.setHours(0,0,0,0); return t; }, []);
  const [endDate, setEndDate] = useState(toISO(today));
  const [startDate, setStartDate] = useState(toISO(addDays(today, -7)));
  const [mode, setMode] = useState("day"); // day | week | month

  const userKey = getUserKey();

  const { labels, intake, burned, weight, exNamesByLabel } = useMemo(() => {
    // 원본
    const WR = storage.get("weightRecords") || {};
    const ER = storage.get("exerciseRecords") || {};
    const DR = storage.get("dietRecords") || {};

    // 사용자 키로만 조회
    const weights = getRecordsStrict(WR, userKey);
    const exercises = getRecordsStrict(ER, userKey);
    const diets = getRecordsStrict(DR, userKey);

    // 기간 필터
    const s = new Date(startDate + "T00:00:00");
    const e = new Date(endDate   + "T23:59:59");

    const inRange = (iso) => {
      if (!iso) return false;
      const d = new Date(iso + "T12:00:00");
      return d >= s && d <= e;
    };

    // 버킷 라벨
    const labelOf = (iso) => {
      const d = new Date(iso + "T12:00:00");
      if (mode === "day") return toISO(d);
      if (mode === "week") {
        const w = startOfWeekMon(d);
        const endW = addDays(w, 6);
        return `${toISO(w)}~${toISO(endW)}`;
      }
      return ym(d);
    };

    // 라벨 시드
    let labelsSet = new Set();
    if (mode === "day") {
      for (let d = new Date(s); d <= e; d = addDays(d, 1)) labelsSet.add(toISO(d));
    } else if (mode === "week") {
      let w = startOfWeekMon(s);
      while (w <= e) { labelsSet.add(`${toISO(w)}~${toISO(addDays(w,6))}`); w = addDays(w, 7); }
    } else {
      let d = new Date(s.getFullYear(), s.getMonth(), 1);
      while (d <= e) { labelsSet.add(ym(d)); d = new Date(d.getFullYear(), d.getMonth()+1, 1); }
    }

    // 누적 버킷
    const exNamesByLabel = {};
    const intake = {}, burned = {}, weightSum = {}, weightCnt = {};
    Array.from(labelsSet).forEach((k) => {
      intake[k] = 0; burned[k] = 0; weightSum[k] = 0; weightCnt[k] = 0; exNamesByLabel[k] = new Set();
    });

    // 식단
    diets.forEach((r) => {
      if (!r?.date || !inRange(r.date)) return;
      const k = labelOf(r.date);
      intake[k] += toNum(r.energy ?? r.kcal);
    });

    // 운동
    exercises.forEach((r) => {
      if (!r?.date || !inRange(r.date)) return;
      const k = labelOf(r.date);
      burned[k] += toNum(r.kcal ?? r.energy ?? r.calories);
      if (r.name) exNamesByLabel[k].add(r.name);
    });

    // 체중: 평균
    weights.forEach((r) => {
      if (!r?.date || !inRange(r.date)) return;
      const k = labelOf(r.date);
      const w = Number(r.weight ?? r.value);
      if (isFinite(w)) { weightSum[k] += w; weightCnt[k] += 1; }
    });

    const labels = Array.from(labelsSet).sort();
    const weight = labels.map((k) => (weightCnt[k] ? +(weightSum[k] / weightCnt[k]).toFixed(1) : null));

    return {
      labels,
      intake: labels.map((k)=>intake[k]),
      burned: labels.map((k)=>burned[k]),
      weight,
      exNamesByLabel
    };
  }, [userKey, startDate, endDate, mode]);

  // 데이터 존재 확인
  const hasAny = intake.some(v=>v>0) || burned.some(v=>v>0) || weight.some(v=>v!=null);

  if (!hasAny) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3 className={styles.title}>📈 변화추이</h3>
          <Controls startDate={startDate} endDate={endDate} mode={mode}
            onStart={setStartDate} onEnd={setEndDate} onMode={setMode} />
        </div>
        <div className={styles.placeholder}>선택한 기간에 데이터가 없습니다</div>
      </div>
    );
  }

  const data = {
    labels,
    datasets: [
      {
        type: "bar",
        label: "섭취 kcal",
        data: intake,
        yAxisID: "y",
        backgroundColor: "rgba(37,99,235,0.35)",
        borderColor: "#2563eb",
        borderWidth: 1,
      },
      {
        type: "bar",
        label: "소모 kcal",
        data: burned,
        yAxisID: "y",
        backgroundColor: "rgba(239,68,68,0.35)",
        borderColor: "#ef4444",
        borderWidth: 1,
      },
      {
        type: "line",
        label: "체중(kg)",
        data: weight,
        yAxisID: "y1",
        tension: 0.3,
        spanGaps: true,
        pointRadius: 3,
        borderWidth: 2,
        borderColor: "#10b981",
        pointBackgroundColor: "#10b981",
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: "index" },
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          beforeBody: (items) => {
            if (!items?.length) return;
            const label = items[0].label;
            const names = Array.from((exNamesByLabel && exNamesByLabel[label]) || []);
            return names.length ? `운동: ${names.join(", ")}` : undefined;
          },
          label: (ctx) => {
            const v = ctx.parsed.y;
            if (ctx.dataset.type === "line") return `체중: ${v} kg`;
            return `${ctx.dataset.label}: ${Math.round(v)} kcal`;
          },
        },
      },
    },
    scales: {
      x: { ticks: { color: "#6b7280" }, grid: { display: false } },
      y: { title: { display: true, text: "kcal" }, beginAtZero: true, ticks: { color: "#6b7280" }, grid: { color: "rgba(0,0,0,0.06)" } },
      y1:{ position: "right", title:{ display:true, text:"체중(kg)" }, ticks:{ color:"#6b7280" }, grid:{ drawOnChartArea:false } },
    },
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>📈 변화추이</h3>
        <Controls startDate={startDate} endDate={endDate} mode={mode}
          onStart={setStartDate} onEnd={setEndDate} onMode={setMode} />
      </div>
      <div className={styles.chartWrap}>
        <Chart type="bar" data={data} options={options} />
      </div>
    </div>
  );
}

// 상단 컨트롤
function Controls({ startDate, endDate, mode, onStart, onEnd, onMode }) {
  return (
    <div className={styles.controls}>
      <label className={styles.controlItem}>
        시작일
        <input type="date" value={startDate} onChange={(e)=>onStart(e.target.value)} />
      </label>
      <label className={styles.controlItem}>
        종료일
        <input type="date" value={endDate} onChange={(e)=>onEnd(e.target.value)} />
      </label>
      <label className={styles.controlItem}>
        보기
        <select value={mode} onChange={(e)=>onMode(e.target.value)}>
          <option value="day">일간</option>
          <option value="week">주간</option>
          <option value="month">월간</option>
        </select>
      </label>
    </div>
  );
}
