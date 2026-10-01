// src/features/dashboard/components/TodaySummaryCard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { storage } from "../../../utils/storage";
import styles from "./css/TodaySummaryCard.module.css";

const fmtLocal = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// userKey별 diet 리스트 로딩(게스트 레거시 포함)
function loadDietFor(userKey) {
  const all = storage.get("dietRecords") || {};
  if (userKey === "guest") {
    if (Array.isArray(all)) return all;       // 레거시 배열
    return all.guest || [];                   // 객체.guest
  }
  if (Array.isArray(all)) return [];          // 레거시 배열이면 비게스트는 없음
  return all[userKey] || [];
}

export default function TodaySummaryCard({ summary }) {
  const [autoSummary, setAutoSummary] = useState({ kcal: 0, carb: 0, protein: 0, fat: 0 });
  const today = useMemo(() => fmtLocal(new Date()), []);

  const recompute = () => {
    const auth = storage.get("currentAuth") || {};
    const userKey = auth.userKey || auth.username || auth.id || "guest";

    const list = loadDietFor(userKey).filter((f) => f.date === today);
    const acc = list.reduce(
      (o, f) => {
        const q = Number(f.quantity) || 1;
        o.kcal += (Number(f.energy) || 0) * q;
        o.protein += (Number(f.protein) || 0) * q;
        o.fat += (Number(f.fat) || 0) * q;
        o.carb += (Number(f.carb) || 0) * q;
        return o;
      },
      { kcal: 0, protein: 0, fat: 0, carb: 0 }
    );

    setAutoSummary({
      kcal: Math.round(acc.kcal),
      carb: Math.round(acc.carb),
      protein: Math.round(acc.protein),
      fat: Math.round(acc.fat),
    });
  };

  useEffect(() => { recompute(); }, [today]);

  // 다른 탭 변경 반영
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "dietRecords" || e.key === "currentAuth") recompute();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  const data = summary || autoSummary;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>📊 오늘 요약</h3>
      <ul className={styles.kpis}>
        <li><strong>{data.kcal}</strong><span>kcal</span></li>
        <li><strong>{data.carb}g</strong><span>탄수</span></li>
        <li><strong>{data.protein}g</strong><span>단백</span></li>
        <li><strong>{data.fat}g</strong><span>지방</span></li>
      </ul>
      <div className={styles.date}>{today}</div>
    </div>
  );
}
