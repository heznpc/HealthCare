// 데이터 집계 및 변환 유틸리티

/* ===== 전체 데이터 합계 계산 ===== */
export const aggregate = (rows = []) =>
  rows.reduce(
    (s, r) => {
      const q = Number(r?.quantity) || 1;
      s.cal += (parseFloat(r?.energy) || 0) * q;
      s.carb += (parseFloat(r?.carb) || 0) * q;
      s.pro += (parseFloat(r?.protein) || 0) * q;
      s.fat += (parseFloat(r?.fat) || 0) * q;
      return s;
    },
    { cal: 0, carb: 0, pro: 0, fat: 0 }
  );

/* ===== 날짜별 데이터 집계 (WeeklyTab, MonthlyTab 공통 사용) ===== */
export const aggregateByDate = (records) => {
  const map = new Map();
  for (const r of records) {
    const key = r.date;
    const q = Number(r.quantity) || 1;
    const cur = map.get(key) || { date: key, cal: 0, proteinG: 0, carbG: 0, fatG: 0 };
    
    cur.cal += (parseFloat(r.energy) || 0) * q;
    cur.proteinG += (parseFloat(r.protein) || 0) * q;
    cur.carbG += (parseFloat(r.carb) || 0) * q;
    cur.fatG += (parseFloat(r.fat) || 0) * q;
    
    map.set(key, cur);
  }
  
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
};