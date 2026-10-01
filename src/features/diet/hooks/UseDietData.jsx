import { localData } from "../../../utils/indexedStore.mjs";
// src/features/diet/hooks/useDietData.jsx
import { useMemo, useState } from "react";
import { calculateNutritionTargets, targetsFromKcal } from "../utils/NutritionCalculator";
import { aggregate } from "../utils/DataAggregator";

/* ===== 내부 유틸 ===== */
const ymd = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const safeJSON = (k, fb) => {
  try {
    const v = localData.getItem(k);
    return v ? JSON.parse(v) : fb;
  } catch {
    return fb;
  }
};

const pickKey = (user, map) => {
  const cands = [
    user?.userKey,
    user?.username,
    user?.id && String(user.id),
    user?.email,
    user?.email?.split("@")?.[0],
    "guest",
  ].filter(Boolean);
  return cands.find((k) => Object.prototype.hasOwnProperty.call(map || {}, k)) ?? "guest";
};

// 주 시작: 월요일
const startOfWeek = (d) => {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon=0 ... Sun=6
  x.setDate(x.getDate() - day);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
};
const endOfWeek = (d) => {
  const s = startOfWeek(d);
  s.setDate(s.getDate() + 6);
  return s;
};
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const daysBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / (24 * 3600 * 1000)) + 1;

/* ===== 메인 훅: mode = 'day' | 'week' | 'month' ===== */
function useDietData(user, { mode = "day", initialDate } = {}) {
  const [date, setDate] = useState(initialDate || ymd());
  const isLoggedIn = !!(user?.userKey || user?.id || user?.username || user?.email);

  // 날짜 이동
  const shiftDays = (n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(ymd(d));
  };
  const shiftMonths = (n) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + n);
    setDate(ymd(new Date(d.getFullYear(), d.getMonth(), 1)));
  };

  // 조회 범위
  const range = useMemo(() => {
    const d = new Date(date);
    if (mode === "week") return { start: ymd(startOfWeek(d)), end: ymd(endOfWeek(d)) };
    if (mode === "month") return { start: ymd(startOfMonth(d)), end: ymd(endOfMonth(d)) };
    return { start: date, end: date };
  }, [date, mode]);

  // 저장소
  const dietMap = safeJSON("dietRecords", {});
  const dietKey = isLoggedIn ? pickKey(user, dietMap) : "guest";
  const all = Array.isArray(dietMap[dietKey]) ? dietMap[dietKey] : [];

  // 범위 필터
  const records = useMemo(
    () => all.filter((r) => r?.date && r.date >= range.start && r.date <= range.end),
    [all, range.start, range.end]
  );

  // 합계
  const agg = useMemo(() => aggregate(records), [records]);

  // --- 목표 읽기: userGoal/userGoals = { [userKey]: Goal[] } 최신 1개 ---
  const goalBucket =
    safeJSON("userGoal", null) ??
    safeJSON("userGoals", null); // 둘 중 하나라도 읽기

  const goalKey = isLoggedIn
    ? pickKey(user, goalBucket || {})
    : "guest";

  let latestGoal = null;
  if (goalBucket && typeof goalBucket === "object" && !Array.isArray(goalBucket)) {
    const arr = Array.isArray(goalBucket[goalKey]) ? goalBucket[goalKey] : [];
    latestGoal = arr.length ? arr[arr.length - 1] : null;
  } else if (goalBucket?.targetCalories) {
    // 레거시 단일 객체 호환
    latestGoal = goalBucket;
  }

  // 목표 계산: 로그인 안 되어 있으면 사용자 프로필 기반 계산도 중단
  const nutritionTargets = useMemo(
    () => (isLoggedIn ? calculateNutritionTargets(user) : null),
    [user, isLoggedIn]
  );
  const kcalTarget = Number(latestGoal?.targetCalories) || 0;

  const baseGoal = nutritionTargets || (kcalTarget > 0 ? targetsFromKcal(kcalTarget) : null);
  const totalDays = daysBetween(range.start, range.end);
  const goalRange =
    mode === "day" || !baseGoal
      ? baseGoal || { cal: 0, carb: 0, protein: 0, fat: 0 }
      : {
          cal: baseGoal.cal * totalDays,
          carb: baseGoal.carb * totalDays,
          protein: baseGoal.protein * totalDays,
          fat: baseGoal.fat * totalDays,
        };

  // KPI 값
  const values = useMemo(
    () => ({ cal: agg.cal, carb: agg.carb, protein: agg.pro, fat: agg.fat }),
    [agg]
  );

  return {
    mode,
    date,
    setDate,
    range,
    days: totalDays,
    records,
    values,
    goal: goalRange,
    goalData: latestGoal || {},
    shiftDays,
    shiftMonths,
  };
}

export default useDietData;
