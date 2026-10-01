// src/features/weight/components/WeightAnalysis.jsx
import React, { useMemo, useState } from "react";
import { storage } from "../../../utils/storage";
import styles from "../css/WeightAnalysis.module.css";
import WeightChart from "./WeightChart";

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

const fmt = (d) => {
  const x = new Date(d); const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const rangeDays = (s, e) => {
  const out = []; const cur = new Date(s); cur.setHours(0,0,0,0);
  const end = new Date(e); end.setHours(0,0,0,0);
  while (cur.getTime() <= end.getTime()) { out.push(fmt(cur)); cur.setDate(cur.getDate() + 1); }
  return out;
};
const toDays = (s) => Math.floor(new Date(s).getTime() / 86400000);
const readUserKey = () => {
  const auth = storage.get("currentAuth");
  return auth?.userKey || auth?.username || auth?.id || "guest";
};

// 최신 목표 kcal 읽기 (userGoals = { [userKey]: Goal[] } | legacy object)
const readTargetKcal = (userKey) => {
  const bucket = storage.get("userGoals");
  if (bucket && typeof bucket === "object" && !Array.isArray(bucket)) {
    const arr = Array.isArray(bucket[userKey]) ? bucket[userKey] : [];
    const latest = arr.length ? arr[arr.length - 1] : null;
    return latest?.targetCalories ? Number(latest.targetCalories) : null;
  }
  if (bucket?.targetCalories) return Number(bucket.targetCalories);
  return null;
};

export default function WeightAnalysis() {
  const userKey = readUserKey();
  const today = fmt(new Date());
  const [startDate, setStartDate] = useState(fmt(addDays(today, -30)));
  const [endDate, setEndDate] = useState(today);

  // 목표 kcal (사용자 최신 목표)
  const target = readTargetKcal(userKey);

  const diet = (storage.get("dietRecords") || {})[userKey] || [];
  const ex = (storage.get("exerciseRecords") || {})[userKey] || [];
  const weightAll = (storage.get("weightRecords") || {})[userKey] || [];

  // ----- 칼로리 집계 -----
  const calRowsAll = useMemo(() => {
    const intakeByDay = new Map();
    for (const f of diet) {
      const d = f?.date; if (!d) continue;
      const q = Number(f?.quantity) || 1;
      const kcal = (Number(f?.energy) || 0) * q;
      intakeByDay.set(d, (intakeByDay.get(d) || 0) + kcal);
    }
    const burnByDay = new Map();
    for (const r of ex) {
      const d = r?.date; if (!d) continue;
      const kcal = Number(r?.kcal) || 0;
      burnByDay.set(d, (burnByDay.get(d) || 0) + kcal);
    }

    return rangeDays(startDate, endDate).map((d) => {
      const intake = Math.round(intakeByDay.get(d) || 0);
      const burn = Math.round(burnByDay.get(d) || 0);
      const netEnergy = intake - burn;                         // 섭취-운동
      const goalSurplus = target ? (intake > 0 ? intake - target : null) : null; // 섭취 있을 때만
      return { date: d, label: d.slice(5), intake, burn, netEnergy, goalSurplus };
    });
  }, [diet, ex, startDate, endDate, target]);

  // ▼ 변경: 기간 전체를 그대로 사용 (최근 21일 자르기 제거)
  const calRows = useMemo(() => calRowsAll, [calRowsAll]);

  const calTotals = useMemo(() => {
    if (!calRows.length) return { avgIntake: 0, avgBurn: 0, avgNetEnergy: 0, avgGoalSurplus: 0 };
    const sum = (fn) => calRows.reduce((a, r) => a + fn(r), 0);
    const days = calRows.length;
    const goalDays = calRows.filter(r => r.goalSurplus !== null).length || 1;
    return {
      avgIntake: Math.round(sum(r => r.intake) / days),
      avgBurn: Math.round(sum(r => r.burn) / days),
      avgNetEnergy: Math.round(sum(r => r.netEnergy) / days),
      avgGoalSurplus: target ? Math.round(sum(r => (r.goalSurplus ?? 0)) / goalDays) : 0,
    };
  }, [calRows, target]);

  const calData = {
    labels: calRows.map(r => r.label),
    datasets: [
      { type: "bar", label: "섭취(kcal)", data: calRows.map(r => r.intake),
        backgroundColor: "rgba(53,162,235,0.6)", borderColor: "rgb(53,162,235)",
        borderWidth: 1, yAxisID: "y", barPercentage: 0.6, categoryPercentage: 0.6, maxBarThickness: 22 },
      { type: "bar", label: "운동소비(kcal)", data: calRows.map(r => r.burn),
        backgroundColor: "rgba(75,192,192,0.6)", borderColor: "rgb(75,192,192)",
        borderWidth: 1, yAxisID: "y", barPercentage: 0.6, categoryPercentage: 0.6, maxBarThickness: 22 },
      { type: "line", label: "순에너지(섭취-운동)", data: calRows.map(r => r.netEnergy),
        borderColor: "rgb(255,99,132)", backgroundColor: "rgba(255,99,132,0.15)",
        pointRadius: 2, tension: 0.3, yAxisID: "y" },
      ...(target ? [{
        type: "line", label: "목표 잉여(섭취-목표)", data: calRows.map(r => r.goalSurplus),
        borderColor: "rgb(153,102,255)", backgroundColor: "rgba(153,102,255,0.15)",
        pointRadius: 2, tension: 0.3, yAxisID: "y", spanGaps: true,
      }] : []),
    ],
  };
  const yVals = calRows.flatMap(r => [r.intake, r.burn, r.netEnergy, r.goalSurplus]).filter(Number.isFinite);
  const calOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "섭취·소비·순에너지 / 목표 잉여" },
      tooltip: {
        callbacks: {
          afterBody: (items) => {
            const i = items?.[0]?.dataIndex ?? -1; if (i < 0) return "";
            const r = calRows[i];
            return [
              `날짜: ${r.date}`,
              `순에너지(섭취-운동): ${r.netEnergy} kcal`,
              target ? (r.goalSurplus !== null ? `목표 잉여(섭취-목표): ${r.goalSurplus} kcal` : "목표 잉여: 기록 없음") : "목표: 없음",
              target ? `목표: ${target} kcal` : "",
            ].filter(Boolean);
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { autoSkip: true, maxTicksLimit: 10 } },
      y: {
        title: { display: true, text: "kcal" },
        suggestedMin: Math.min(0, (yVals.length ? Math.min(...yVals) : 0) - 100),
        suggestedMax: (yVals.length ? Math.max(...yVals) : 800) + 100,
        grid: { color: "rgba(0,0,0,0.06)" },
      },
    },
  };

  // ----- 체중 분석 -----
  const weightRows = useMemo(() => {
    return weightAll
      .filter(r => r.date >= startDate && r.date <= endDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [weightAll, startDate, endDate]);

  const weightMetrics = useMemo(() => {
    const n = weightRows.length;
    if (!n) return null;
    const first = weightRows[0];
    const last = weightRows[n - 1];
    const totalChange = +(last.weight - first.weight).toFixed(1);
    let sx=0, sy=0, sxy=0, sxx=0;
    for (const r of weightRows) { const x=toDays(r.date), y=r.weight; sx+=x; sy+=y; sxy+=x*y; sxx+=x*x; }
    const denom = n * sxx - sx * sx || 1;
    const slopePerWeek = +(((n * sxy - sx * sy) / denom) * 7).toFixed(2);
    const vals = weightRows.map(r=>r.weight);
    return { first, last, totalChange, slopePerWeek, min: Math.min(...vals), max: Math.max(...vals) };
  }, [weightRows]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🔥 칼로리·체중 분석</h2>
        <div className={styles.controls}>
          <label>시작일</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <label>종료일</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {/* 칼로리 KPI */}
      <div className={styles.kpis}>
        <div className={styles.kpi}><span className={styles.kLabel}>평균 섭취</span><strong className={styles.kVal}>{calTotals.avgIntake} kcal</strong></div>
        <div className={styles.kpi}><span className={styles.kLabel}>평균 소비</span><strong className={styles.kVal}>{calTotals.avgBurn} kcal</strong></div>
        <div className={styles.kpi}><span className={styles.kLabel}>평균 순에너지</span><strong className={styles.kVal}>{calTotals.avgNetEnergy} kcal</strong></div>
        <div className={styles.kpi}><span className={styles.kLabel}>{target ? "평균 목표 잉여" : "목표 미설정"}</span><strong className={styles.kVal}>{target ? `${calTotals.avgGoalSurplus} kcal` : "-"}</strong></div>
      </div>

      <div className={styles.note}>
        {target ? <>목표 <b>{target} kcal/일</b> 기준. 섭취 없는 날은 “목표 잉여” 계산에서 제외.</> : <>목표 미설정. “목표 잉여” 비표시.</>}
      </div>

      <div className={styles.chartCardSmall}>
        <Bar data={calData} options={calOptions} />
      </div>

      {/* 체중 KPI */}
      {!weightRows.length ? (
        <div className={styles.empty}>기간 내 체중 기록이 없습니다.</div>
      ) : (
        <>
          <div className={styles.kpis}>
            <div className={styles.kpi}><span className={styles.kLabel}>시작 ⟶ 현재</span><strong className={styles.kVal}>{weightMetrics.first.weight}kg ⟶ {weightMetrics.last.weight}kg</strong></div>
            <div className={styles.kpi}><span className={styles.kLabel}>총 변화량</span><strong className={styles.kVal}>{weightMetrics.totalChange} kg</strong></div>
            <div className={styles.kpi}><span className={styles.kLabel}>추세(주당)</span><strong className={styles.kVal}>{weightMetrics.slopePerWeek} kg/주</strong></div>
            <div className={styles.kpi}><span className={styles.kLabel}>최저 / 최고</span><strong className={styles.kVal}>{weightMetrics.min} / {weightMetrics.max} kg</strong></div>
          </div>

          <div className={styles.chartCardSmall}>
            <WeightChart records={weightRows} title="체중 추이" yLabel="kg" />
          </div>
        </>
      )}
    </div>
  );
}
