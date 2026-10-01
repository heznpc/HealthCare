import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import styles from "./css/WeightCalendar.module.css";
import { storage } from "../../../utils/storage";
import GoalSetupWizard from "../../../features/diet/components/GoalSetupWizard.jsx";

const DBLCLICK_MS = 450;
const fmtLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function WeightCalendar() {
  const [value, setValue] = useState(new Date());
  const [rows, setRows] = useState([]);
  const [goal, setGoal] = useState(null);
  const [openGoalWizard, setOpenGoalWizard] = useState(false);
  const nav = useNavigate();
  const lastClickRef = useRef({ iso: "", ts: 0 });

  useEffect(() => {
    const userKey = storage.get("currentAuth")?.userKey || "guest";

    // 체중 기록
    const all = storage.get("weightRecords") || {};
    const mine = Array.isArray(all[userKey]) ? all[userKey] : [];
    const cleaned = mine
      .filter((r) => r?.date && Number.isFinite(+r.weight))
      .map((r) => ({ date: r.date, weight: Number(r.weight) }))
      .sort((a, b) => a.date.localeCompare(b.date));
    setRows(cleaned);

    // 목표
    const bucket = storage.get("userGoals");
    let latest = null;
    if (bucket && typeof bucket === "object" && !Array.isArray(bucket)) {
      const arr = Array.isArray(bucket[userKey]) ? bucket[userKey] : [];
      latest = arr.length ? arr[arr.length - 1] : null;
    }
    if (latest?.goalWeight) {
      setGoal({
        goalWeight: Number(latest.goalWeight),
        startWeight: Number(latest.startWeight || 0),
      });
    } else {
      setGoal(null);
    }
  }, []);

  const dayWeightMap = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => m.set(r.date, r.weight));
    return m;
  }, [rows]);

  const trendMap = useMemo(() => {
    if (!goal?.goalWeight || rows.length === 0) return new Map();
    const m = new Map();
    let prev = null;
    rows.forEach((r) => {
      if (!prev) {
        m.set(r.date, "same");
        prev = r;
        return;
      }
      const prevGap = Math.abs(prev.weight - goal.goalWeight);
      const nowGap = Math.abs(r.weight - goal.goalWeight);
      let tag = "same";
      if (nowGap < prevGap - 1e-9) tag = "better";
      else if (nowGap > prevGap + 1e-9) tag = "worse";
      if (Math.sign(prev.weight - goal.goalWeight) !== Math.sign(r.weight - goal.goalWeight))
        tag = "better";
      m.set(r.date, tag);
      prev = r;
    });
    return m;
  }, [rows, goal?.goalWeight]);

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const iso = fmtLocal(date);
    const w = dayWeightMap.get(iso);
    if (w == null) return null;

    const trend = trendMap.get(iso) || "same";
    return (
      <div className={styles.cellWrap}>
        <span className={styles.weightPill}>{w}kg</span>
        <i
          className={
            trend === "better"
              ? `${styles.trendDot} ${styles.better}`
              : trend === "worse"
              ? `${styles.trendDot} ${styles.worse}`
              : `${styles.trendDot} ${styles.same}`
          }
          title={trend === "better" ? "목표 접근" : trend === "worse" ? "목표 이탈" : "유지"}
        />
      </div>
    );
  };

  const onClickDay = (d) => {
    const iso = fmtLocal(d);
    const now = Date.now();
    const { iso: lastIso, ts } = lastClickRef.current;
    if (iso === lastIso && now - ts < DBLCLICK_MS) nav(`/weight/weight-record?date=${iso}`);
    lastClickRef.current = { iso, ts: now };
  };

  const Legend = () => (
    <div className={styles.legend}>
      <span className={`${styles.legendItem} ${styles.legendBetter}`}><i /> 목표 접근</span>
      <span className={`${styles.legendItem} ${styles.legendSame}`}><i /> 유지</span>
      <span className={`${styles.legendItem} ${styles.legendWorse}`}><i /> 목표 이탈</span>
    </div>
  );

  const handleSaveGoal = (saved) => {
    setGoal({
      goalWeight: Number(saved.goalWeight),
      startWeight: Number(saved.startWeight || 0),
    });
    setOpenGoalWizard(false);
  };

  return (
    <div className={styles.container}>
      {goal?.goalWeight ? (
        <div className={styles.goalBox}>
          목표 체중: <strong>{goal.goalWeight} kg</strong>
        </div>
      ) : (
        <div className={styles.goalBoxMuted}>
          목표 체중을 먼저 저장하세요.{" "}
          <button className={styles.linkBtn} onClick={() => setOpenGoalWizard(true)}>설정</button>
        </div>
      )}

      <Legend />

      <Calendar
        onChange={setValue}
        value={value}
        tileContent={tileContent}
        onClickDay={onClickDay}
        locale="ko-KR"
        className={styles.calendar}
        prev2Label={null}
        next2Label={null}
        prevLabel="‹"
        nextLabel="›"
        navigationLabel={({ date }) => `${date.getFullYear()}년 ${date.getMonth() + 1}월`}
        formatShortWeekday={(_, d) => ["일", "월", "화", "수", "목", "금", "토"][d.getDay()]}
        formatDay={(_, date) => `${date.getDate()}일`}
      />

      <GoalSetupWizard
        open={openGoalWizard}
        onClose={() => setOpenGoalWizard(false)}
        onSave={handleSaveGoal}
      />
    </div>
  );
}
