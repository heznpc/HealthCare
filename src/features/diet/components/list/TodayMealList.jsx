// src/features/diet/components/list/TodayMealList.jsx
import { useEffect, useMemo, useState } from "react";
import styles from "../../css/TodayMealList.module.css";
import { useAuth } from "../../../../auth/useAuth";
import { storage } from "../../../../utils/storage";

export default function TodayMealList({ date, records = [] }) {
  const { user } = useAuth();
  const [mealData, setMealData] = useState([]);
  const [loading, setLoading] = useState(true);

  const resolveUserKey = (u) => u?.userKey || u?.username || u?.id || null;

  const toHourBucket = (timeStr) => {
  const m = String(timeStr || "").match(/^(\d{1,2})/);
  const hour = m ? Math.min(23, Math.max(0, parseInt(m[1], 10))) : 0; // 👈 네가 말한 로직
  return `${String(hour).padStart(2, "0")}:00`;
  };

  // props.records 우선 → 비면 storage(dietRecords[userKey]) 사용
  const loadMealData = () => {
    try {
      const fromProps = (records || [])
        .filter((r) => r?.date === date)
        .sort((a, b) => String(a?.time || "").localeCompare(String(b?.time || "")))
        .map((r) => ({
          time: r.time || "",
          mealType: r.mealType || "기타",
          foods: r.name || r.foods || "",
          calories: (Number(r.energy) || 0) * (Number(r.quantity) || 1),
        }));

      if (fromProps.length > 0) {
        setMealData(fromProps);
        return;
      }

      const userKey = resolveUserKey(user);
      if (!userKey) {
        setMealData([]);
        return;
      }

      const all = storage.get("dietRecords") || {};
      const list = all[userKey] || [];

      const fromStorage = list
        .filter((f) => f.date === date)
        .sort((a, b) => String(a?.time || "").localeCompare(String(b?.time || "")))
        .map((f) => ({
          time: f.time || "",
          mealType: f.mealType || "기타",
          foods: f.name || f.foods || "",
          calories: (Number(f.energy) || 0) * (Number(f.quantity) || 1),
        }));

      setMealData(fromStorage);
    } catch (e) {
      console.error("식단 데이터 로드 중 오류:", e);
      setMealData([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadMealData();
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, date, records]);

  // ✅ (mealType, time) 단위로 합치기 (li 한 줄에 합쳐 보여줌)
  const rowsCombined = useMemo(() => {
  // (mealType, hourBucket) → 합치기
  const map = new Map();
  for (const m of mealData) {
    const type = m.mealType || "기타";
    const hourLabel = toHourBucket(m.time);              // 👈 시간 버킷으로 정규화
    const key = `${type}__${hourLabel}`;
    if (!map.has(key)) map.set(key, { time: hourLabel, mealType: type, foods: new Set(), calories: 0 });
    const slot = map.get(key);
    if (m.foods) slot.foods.add(String(m.foods));
    slot.calories += Number(m.calories) || 0;
  }

    // 2) 사용자 탭 순서(있으면 적용)
    const userKey = (user?.userKey || user?.username || user?.id || null);
    const savedTabs = userKey ? storage.get(`dietMealTabs::${userKey}`) : null;
    const orderArr = Array.isArray(savedTabs) && savedTabs.length
      ? savedTabs.filter(Boolean)
      : Array.from(new Set(mealData.map(m => m.mealType).filter(Boolean)));
    const orderMap = new Map(orderArr.map((t, i) => [t, i]));

    // 정렬: 시간 오름차순 → 같은 시간 내 타입 순서
      const arr = Array.from(map.values()).map(v => ({ ...v, foods: Array.from(v.foods).join(", ") }));
      const hourNum = (label) => parseInt(String(label).slice(0,2), 10);  // "HH:00" → HH 숫자
      arr.sort((a, b) => {
        const tcmp = hourNum(a.time) - hourNum(b.time);
        if (tcmp !== 0) return tcmp;
        const ia = orderMap.has(a.mealType) ? orderMap.get(a.mealType) : 999;
        const ib = orderMap.has(b.mealType) ? orderMap.get(b.mealType) : 999;
        return ia - ib || a.mealType.localeCompare(b.mealType);
      });

      return arr;
    }, [mealData, user]);

  // 총합(합쳐진 행 기준이든 원본 기준이든 동일)
  const totalCalories = useMemo(
    () => rowsCombined.reduce((sum, r) => sum + (Number(r.calories) || 0), 0),
    [rowsCombined]
  );

  if (loading) {
    return (
      <div className={styles["mh-loadingWrap"]}>
        <div className={styles["mh-loadingText"]}>식단 기록을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className={styles["mh-container"]}>
      {rowsCombined.length > 0 ? (
        <ul className={styles["mh-list"]}>
          {rowsCombined.map((row, idx) => (
            <li key={`${row.time}-${row.mealType}-${idx}`} className={styles["mh-item"]}>
              <div className={styles["mh-left"]}>
                <div className={styles["mh-time"]}>{row.time}</div>
                <div className={styles["mh-type"]}>{row.mealType}</div>
                <div className={styles["mh-foods"]}>{row.foods}</div>
              </div>
              <div className={styles["mh-kcal"]}>
                {Number.isFinite(row.calories) ? `${Math.round(row.calories)}kcal` : "-"}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles["mh-empty"]}>
          <p>오늘 식사 기록이 없습니다.</p>
          <p className={styles["mh-emptySub"]}>식단 등록 페이지에서 식사를 기록해보세요!</p>
        </div>
      )}

      {rowsCombined.length > 0 && (
        <div className={styles["mh-stats"]}>
          <div className={styles["mh-statsGrid"]}>
            <div>
              <div className={styles["mh-statsNumber"]}>{rowsCombined.length}</div>
              <div className={styles["mh-statsLabel"]}>총 행 수</div>
            </div>
            <div>
              <div className={`${styles["mh-statsNumber"]} ${styles["mh-statsNumber--green"]}`}>
                {Math.round(totalCalories)}
              </div>
              <div className={styles["mh-statsLabel"]}>총 칼로리</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


