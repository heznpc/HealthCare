import { showAlert, showGuestLimit } from '../../../utils/dialogs';
import { guestPolicy } from '../../../utils/guestStorage';
import GuestNotice from '../../../components/commons/GuestNotice';
// src/features/weight/components/WeightRecord.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { storage } from "../../../utils/storage";
import WeightChart from "./WeightChart";
import styles from "../css/WeightRecord.module.css";

const fmtDate = (d) => {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
const isValidISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "") && fmtDate(new Date(s)) === s;
const startOfWeek = (d) => { const x = new Date(d); const diff = (x.getDay() + 6) % 7; x.setDate(x.getDate() - diff); x.setHours(0,0,0,0); return x; };
const endOfWeek = (d) => addDays(startOfWeek(d), 6);
const startOfMonth = (d) => { const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; };

export default function WeightRecord() {
  const userKey = storage.get("currentAuth")?.userKey || "guest";
  const isGuest = userKey === "guest";
  const todayStr = fmtDate(new Date().setHours(0,0,0,0));
  const location = useLocation();

  const [date, setDate] = useState(todayStr);
  const [weight, setWeight] = useState("");
  const [rangeMode, setRangeMode] = useState("week"); // day | week | month
  const [startDate, setStartDate] = useState(fmtDate(addDays(new Date(todayStr), -7)));
  const [endDate, setEndDate] = useState(todayStr);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("date");
    if (!isValidISO(q)) return;
    setDate(q);
    setEndDate(q);
    const base = new Date(q);
    if (rangeMode === "day") setStartDate(q);
    else if (rangeMode === "week") setStartDate(fmtDate(addDays(startOfWeek(base), -7 * 11)));
    else setStartDate(fmtDate(startOfMonth(addMonths(base, -5))));
  }, [location.search, rangeMode]);

  const loadRecords = () => {
    const all = storage.get("weightRecords") || {};
    const list = (all[userKey] || []).filter(r => r.date >= startDate && r.date <= endDate)
      .sort((a,b)=> new Date(a.date)-new Date(b.date));
    setRecords(list);
  };
  useEffect(() => { loadRecords(); }, [startDate, endDate, userKey]);

  const handleAdd = () => {
    if (!weight || isNaN(weight)) { showAlert("체중을 숫자로 입력하세요."); return; }
    const all = storage.get("weightRecords") || {};
    const list = all[userKey] || [];
    const idx = list.findIndex(r => r.date === date);

    if (idx >= 0) list[idx].weight = Number(weight);
    else list.push({ date, weight: Number(weight) });

    all[userKey] = list;
    if (!guestPolicy.save(userKey, () => storage.set("weightRecords", all))) {
      showGuestLimit();
      return;
    }
    setWeight(""); loadRecords();
  };

  const handleDateChange = (v) => { if (isValidISO(v)) { setDate(v); setEndDate(v); } };

  const handleRangeChange = (mode) => {
    setRangeMode(mode);
    const base = new Date(date);
    setEndDate(fmtDate(base));
    if (mode === "day") setStartDate(fmtDate(base));
    else if (mode === "week") setStartDate(fmtDate(addDays(startOfWeek(base), -7 * 11)));
    else setStartDate(fmtDate(startOfMonth(addMonths(base, -5))));
  };

  const aggregated = useMemo(() => {
    const list = records;
    if (!list.length) return [];
    if (rangeMode === "day") {
      const only = list.filter(r => r.date === endDate);
      return only.length <= 1 ? only : only.slice(-1);
    }
    if (rangeMode === "week") {
      const map = new Map();
      list.forEach(r => {
        const ws = fmtDate(startOfWeek(r.date));
        const v = map.get(ws) || { sum: 0, cnt: 0 };
        v.sum += Number(r.weight); v.cnt += 1; map.set(ws, v);
      });
      return [...map.entries()].map(([ws,v])=>({ date: ws, weight: +(v.sum/v.cnt).toFixed(1)}))
        .sort((a,b)=> new Date(a.date)-new Date(b.date));
    }
    const map = new Map();
    list.forEach(r => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const v = map.get(key) || { sum: 0, cnt: 0 };
      v.sum += Number(r.weight); v.cnt += 1; map.set(key, v);
    });
    return [...map.entries()].map(([ym,v])=>({ date: `${ym}-01`, weight: +(v.sum/v.cnt).toFixed(1)}))
      .sort((a,b)=> new Date(a.date)-new Date(b.date));
  }, [records, endDate, rangeMode]);

  const chartRecords = useMemo(() => {
    if (rangeMode !== "day") return aggregated;
    if (aggregated.length === 1) {
      const only = aggregated[0];
      const prev = fmtDate(addDays(only.date, -1));
      return [{ date: prev, weight: only.weight }, only];
    }
    return aggregated;
  }, [aggregated, rangeMode]);

  const bucketLabel = (dStr) => {
    if (rangeMode === "week") return `${fmtDate(startOfWeek(dStr))} ~ ${fmtDate(endOfWeek(dStr))}`;
    if (rangeMode === "month") { const d = new Date(dStr); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
    return dStr;
  };

  const stats = useMemo(() => {
    const list = aggregated;
    const res = { total: list.length, maxLoss: 0, lossPeriod: "", maxGain: 0, gainPeriod: "" };
    if (list.length < 2) return res;
    for (let i=1;i<list.length;i++){
      const diff = +(list[i-1].weight - list[i].weight).toFixed(1);
      if (diff > res.maxLoss) { res.maxLoss = diff; res.lossPeriod = `${bucketLabel(list[i-1].date)} → ${bucketLabel(list[i].date)}`; }
      if (-diff > res.maxGain) { res.maxGain = -diff; res.gainPeriod = `${bucketLabel(list[i-1].date)} → ${bucketLabel(list[i].date)}`; }
    }
    return res;
  }, [aggregated, rangeMode]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>⚖️ 체중 기록</h2>

      {isGuest && (
        <div className={styles.guestNotice}><GuestNotice /></div>
      )}

      <div className={styles.card}>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label}>날짜</label>
            <input className={styles.input} type="date" value={date} onChange={(e)=>handleDateChange(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>체중(kg)</label>
            <input className={styles.input} type="number" value={weight} onChange={(e)=>setWeight(e.target.value)} placeholder="예: 80" inputMode="decimal" />
          </div>
          <div className={styles.actionField}>
            <button className={styles.btnPrimary} onClick={handleAdd}>추가</button>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.btnGroup}>
            <button className={`${styles.btn} ${rangeMode==="day"?styles.btnActive:""}`} onClick={()=>handleRangeChange("day")}>일간</button>
            <button className={`${styles.btn} ${rangeMode==="week"?styles.btnActive:""}`} onClick={()=>handleRangeChange("week")}>주간</button>
            <button className={`${styles.btn} ${rangeMode==="month"?styles.btnActive:""}`} onClick={()=>handleRangeChange("month")}>월간</button>
          </div>

          <div className={styles.rangeRow}>
            <label className={styles.labelSmall}>시작일</label>
            <input className={styles.input} type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
            <label className={styles.labelSmall}>종료일</label>
            <input className={styles.input} type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className={styles.chartCard}>
        <WeightChart records={chartRecords} title="체중 추이" yLabel="kg" />
        {rangeMode==="day" && aggregated.length===1 && (<div className={styles.singlePointInfo}>선택일 체중: <b>{aggregated[0].weight}</b> kg</div>)}
        {rangeMode==="day" && aggregated.length===0 && (<div className={styles.emptyNote}>선택한 날짜에 기록이 없습니다. 위에서 체중을 추가해 보세요.</div>)}
      </div>

      <div className={styles.summaryCard}>
        <div className={styles.summaryHeader}>📊 요약</div>
        <div className={styles.summaryBody}>
          <div className={styles.statBox}><div className={styles.statLabel}>표시 구간(점) 수</div><div className={styles.statValue}>{stats.total ?? 0}개</div></div>
          {Number(stats.maxLoss)>0 && (<><div className={styles.statBox}><div className={styles.statLabel}>가장 많이 감량한 시기</div><div className={styles.statValue}>{stats.lossPeriod}</div></div><div className={styles.statBox}><div className={styles.statLabel}>감량량</div><div className={styles.statValue}>{stats.maxLoss}kg</div></div></>)}
          {Number(stats.maxGain)>0 && (<><div className={styles.statBox}><div className={styles.statLabel}>가장 많이 증량한 시기</div><div className={styles.statValue}>{stats.gainPeriod}</div></div><div className={styles.statBox}><div className={styles.statLabel}>증량량</div><div className={styles.statValue}>{stats.maxGain}kg</div></div></>)}
        </div>
      </div>
    </div>
  );
}
