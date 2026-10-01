import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import styles from "./css/DietCategoryCalendar.module.css";
import { storage } from "../../../utils/storage";

const DBLCLICK_MS = 450;

const fmtLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const PRESET = { 아침: "#facc15", 점심: "#fb923c", 저녁: "#a78bfa", 간식: "#34d399" };
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
const COLOR_KEY = "dietCategoryColors";

export default function DietCategoryCalendar() {
  const [value, setValue] = useState(new Date());
  const [categoryMap, setCategoryMap] = useState({});
  const [colorMap, setColorMap] = useState({});
  const [userKey, setUserKey] = useState(null);
  const navigate = useNavigate();
  const lastClickRef = useRef({ iso: "", ts: 0 });

  useEffect(() => {
    const auth = storage.get("currentAuth") || {};
    const role =
      auth.role ||
      auth.profile?.role ||
      auth.authorities?.[0]?.role ||
      auth.authorities?.[0]?.role_name ||
      "GUEST";

    const parsedKey = role === "GUEST" ? "guest" : auth.userKey || auth.username || auth.id;
    if (!parsedKey) return;
    setUserKey(parsedKey);

    const allData = storage.get("dietRecords") || {};
    let rows = [];

    if (parsedKey === "guest") {
      rows = Array.isArray(allData) ? allData : allData.guest || [];
    } else {
      const rawUser = auth.username || auth.id;
      if (!Array.isArray(allData) && allData[rawUser] && rawUser !== parsedKey) {
        const merged = [...(allData[parsedKey] || []), ...allData[rawUser]];
        allData[parsedKey] = merged;
        delete allData[rawUser];
        storage.set("dietRecords", allData);
      }
      rows = Array.isArray(allData) ? [] : allData[parsedKey] || [];
    }

    // 날짜별 카테고리 집계
    const map = {};
    rows.forEach(({ date, mealType }) => {
      if (!date || !mealType) return;
      (map[date] ||= new Set()).add(mealType);
    });
    setCategoryMap(map);

    // 색상 매핑
    const saved = storage.get(COLOR_KEY) || {};
    const used = new Set(Object.values(saved));
    const next = { ...PRESET, ...saved };
    const allCats = new Set(rows.map((r) => r.mealType).filter(Boolean));

    const pick = () => {
      const hex = PALETTE.find((h) => !used.has(h));
      if (hex) {
        used.add(hex);
        return hex;
      }
      const h = Math.floor(Math.random() * 360);
      const c = `hsl(${h} 75% 70%)`;
      used.add(c);
      return c;
    };

    for (const cat of allCats) if (!next[cat]) next[cat] = pick();
    storage.set(COLOR_KEY, next);
    setColorMap(next);
  }, []);

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const iso = fmtLocal(date);
    const cats = categoryMap[iso];
    if (!cats?.size) return null;
    return (
      <div className={styles.dots}>
        {[...cats].map((cat) => (
          <span
            key={cat}
            className={styles.dot}
            style={{ background: colorMap[cat] || "#cbd5e1" }}
            title={cat}
          />
        ))}
      </div>
    );
  };

  const legendItems = useMemo(() => {
    const set = new Set();
    Object.values(categoryMap).forEach((s) => s.forEach((v) => set.add(v)));
    return [...set].sort((a, b) => a.localeCompare(b, "ko"));
  }, [categoryMap]);

  const onClickDay = (dateObj) => {
    const iso = fmtLocal(dateObj);
    const now = Date.now();
    const { iso: lastIso, ts: lastTs } = lastClickRef.current;
    if (iso === lastIso && now - lastTs < DBLCLICK_MS) {
      navigate(`/diet/diet-record?date=${iso}`);
    }
    lastClickRef.current = { iso, ts: now };
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>🥗 식단 카테고리 캘린더</h3>

      {legendItems.length > 0 && (
        <div className={styles.legend}>
          {legendItems.map((cat) => (
            <span key={cat} className={styles.legendItem}>
              <i className={styles.legendDot} style={{ background: colorMap[cat] || "#cbd5e1" }} />
              {cat}
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
        className={styles.rc}
        prev2Label={null}
        next2Label={null}
        prevLabel="‹"
        nextLabel="›"
        navigationLabel={({ date }) => `${date.getFullYear()}년 ${date.getMonth() + 1}월`}
      />
    </div>
  );
}
