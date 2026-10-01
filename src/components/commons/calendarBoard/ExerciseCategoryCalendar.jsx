import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import styles from "./css/ExerciseCategoryCalendar.module.css";
import { storage } from "../../../utils/storage";

const DBLCLICK_MS = 450;

const fmtLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const num = (v) => {
  const n = typeof v === "string" ? v.replace(/[^\d.\-]/g, "") : v;
  const parsed = Number(n);
  return Number.isFinite(parsed) ? parsed : 0;
};

const PALETTE = [
  "#60a5fa",
  "#f87171",
  "#4ade80",
  "#fbbf24",
  "#f472b6",
  "#22d3ee",
  "#c084fc",
  "#f59e0b",
  "#a3e635",
  "#38bdf8",
  "#fb7185",
  "#10b981",
];
const COLOR_KEY = "exerciseCategoryColors";

export default function ExerciseCategoryCalendar() {
  const [value, setValue] = useState(new Date());
  const [categoryMap, setCategoryMap] = useState({});
  const [kcalMap, setKcalMap] = useState({});
  const [colorMap, setColorMap] = useState({});
  const navigate = useNavigate();
  const lastClickRef = useRef({ iso: "", ts: 0 });

  useEffect(() => {
    const auth = storage.get("currentAuth");
    const key = auth?.userKey || auth?.username || auth?.id || "guest";

    const all = storage.get("exerciseRecords") || {};
    const rows = Array.isArray(all) ? all : all[key] || [];

    if (auth && !Array.isArray(all)) {
      const legacyKey = auth.username || auth.id;
      if (legacyKey && all[legacyKey] && legacyKey !== key) {
        const merged = [...(all[key] || []), ...all[legacyKey]];
        all[key] = merged;
        delete all[legacyKey];
        storage.set("exerciseRecords", all);
      }
    }

    const cMap = {};
    const kMap = {};
    rows.forEach((r) => {
      const { date, name } = r || {};
      if (!date) return;
      if (name) (cMap[date] ||= new Set()).add(name);

      const kcalVal =
        r?.kcal ?? r?.calories ?? r?.calorie ?? r?.burned ?? r?.burnKcal ?? 0;
      kMap[date] = (kMap[date] || 0) + num(kcalVal);
    });
    setCategoryMap(cMap);
    setKcalMap(kMap);

    const saved = storage.get(COLOR_KEY) || {};
    const used = new Set(Object.values(saved));
    const pick = () => {
      const hex = PALETTE.find((h) => !used.has(h));
      if (hex) {
        used.add(hex);
        return hex;
      }
      const h = Math.floor(Math.random() * 360);
      const c = `hsl(${h} 70% 65%)`;
      used.add(c);
      return c;
    };
    const allNames = new Set(rows.map((r) => r?.name).filter(Boolean));
    const next = { ...saved };
    for (const n of allNames) if (!next[n]) next[n] = pick();
    storage.set(COLOR_KEY, next);
    setColorMap(next);
  }, []);

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const iso = fmtLocal(date);
    const names = categoryMap[iso];
    const hasDay = (names && names.size > 0) || iso in kcalMap;
    if (!hasDay) return null;

    const kcal = iso in kcalMap ? kcalMap[iso] : 0;

    return (
      <>
        {names?.size ? (
          <div className={styles.dots}>
            {[...names].slice(0, 6).map((n) => (
              <span
                key={n}
                className={styles.dot}
                style={{ background: colorMap[n] || "#cbd5e1" }}
                title={n}
              />
            ))}
          </div>
        ) : null}
        <div className={styles.kcalBadge} title={`소비 칼로리 ${kcal} kcal`}>
          {kcal.toLocaleString()}kcal
        </div>
      </>
    );
  };

  const legendItems = useMemo(() => {
    const s = new Set();
    Object.values(categoryMap).forEach((set) => set.forEach((v) => s.add(v)));
    return [...s].sort((a, b) => a.localeCompare(b, "ko"));
  }, [categoryMap]);

  const onClickDay = (dateObj) => {
    const iso = fmtLocal(dateObj);
    const now = Date.now();
    const { iso: prevIso, ts } = lastClickRef.current;
    if (iso === prevIso && now - ts < DBLCLICK_MS) {
      navigate(`/exercise/exercise-record?date=${iso}`);
    }
    lastClickRef.current = { iso, ts: now };
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>🏋️ 운동 카테고리 캘린더</h3>

      {legendItems.length > 0 && (
        <div className={styles.legend}>
          {legendItems.map((name) => (
            <span key={name} className={styles.legendItem}>
              <i
                className={styles.legendDot}
                style={{ background: colorMap[name] || "#cbd5e1" }}
              />
              {name}
            </span>
          ))}
        </div>
      )}

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
        navigationLabel={({ date }) =>
          `${date.getFullYear()}년 ${date.getMonth() + 1}월`
        }
      />
    </div>
  );
}
