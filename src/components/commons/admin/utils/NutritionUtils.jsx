// 영양소 및 칼로리 계산 공통 유틸리티

/* ===== 활동계수 ===== */
export const activityFactor = (level) => ({
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
}[level] || null);

/* ===== 목표치 계산 (ChatDietRecommender의 calcTargets 로직 재사용) ===== */
export function calculateNutritionTargets(user) {
  if (!user) return null;

  // 성별 보정 (기존 로직 유지)
  let sex = user.sex || user.gender;
  if (sex === "M") sex = "male";
  if (sex === "F") sex = "female";

  const weight = Number(user.startWeight || user.weight);
  const height = Number(user.heightCm || user.height);
  const age = Number(user.age);
  const activity = activityFactor(user.activityKey || user.activity);

  if (!sex || !weight || !height || !age || !activity) return null;

  // BMR 계산 (Mifflin-St Jeor 공식)
  const bmr = (sex === "male" || sex === "남")
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  // TDEE 계산
  let tdee = Math.round(bmr * activity);
  if (user.targetCalories) tdee = Number(user.targetCalories); // 목표칼로리 있으면 우선

  // 매크로 영양소 계산 (기존 비율 유지: 단백질 30%, 탄수화물 50%, 지방 20%)
  const proteinCal = Math.round(tdee * 0.3);
  const carbCal = Math.round(tdee * 0.5);
  const fatCal = tdee - proteinCal - carbCal;

  return {
    // ChatDietRecommender용 필드
    tdee,
    bmr: Math.round(bmr),
    proteinG: Math.round(proteinCal / 4),
    carbG: Math.round(carbCal / 4),
    fatG: Math.round(fatCal / 9),
    
    // useDietData와 호환성을 위한 필드
    cal: tdee,
    carb: Math.round(carbCal / 4),
    protein: Math.round(proteinCal / 4),
    fat: Math.round(fatCal / 9)
  };
}

/* ===== useDietData에서 사용하던 집계 함수 (기존 로직 유지) ===== */
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

/* ===== 기존 useDietData의 targetsFromKcal 로직 유지 (하위 호환성) ===== */
export const targetsFromKcal = (kcal = 0) => ({
  cal: kcal,
  carb: kcal ? Math.round((kcal * 0.5) / 4) : 0,
  protein: kcal ? Math.round((kcal * 0.3) / 4) : 0,
  fat: kcal ? Math.round((kcal * 0.2) / 9) : 0,
});


/* ===== KPI CARD 적용 함수 ===== */

/* 일간 뷰 */


/* 주간 뷰 */
// 목표 달성일 계산
export const calculateAchievedDays = (dailyData, dailyGoal) => {
  if (!dailyData || !Array.isArray(dailyData) || !dailyGoal?.cal) 
  
    return 0;
  
  return dailyData.filter(day => (day.cal || 0) >= dailyGoal.cal).length;  
  };

  // 최고 섭취 칼로리 찾기
    export const calculateMaxCalorie = (dailyData) => {
      if (!dailyData || !Array.isArray(dailyData) || dailyData.length === 0)
         return 0;

    return Math.max(...dailyData.map(day => day.cal || 0)) + "kcal";
};

// 최고 칼로리를 섭취한 날 찾기 (실제 날짜와 요일 반환)
export const findMaxCalorieDay = (dailyData) => {
    if (!dailyData || !Array.isArray(dailyData) || dailyData.length === 0) return "0일";

    let maxDayDate = "";
    let maxCalories = -1;

    dailyData.forEach((day) => {
      if ((day.cal || 0) > maxCalories) {
        maxCalories = day.cal || 0;
        maxDayDate = day.date; // YYYY-MM-DD 형태
      }
    });

    if (maxDayDate) {
      const date = new Date(maxDayDate);
      const dayOfMonth = parseInt(maxDayDate.split('-')[2], 10);
      const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
      const dayName = weekdays[date.getDay()];
      
      return `${dayOfMonth}(${dayName})`;
    }
    
    return "0일";
};


// 평균 칼로리 계산
export const calculateAvgCalories = (dailyData, days = 7) => {
  if (!dailyData || !Array.isArray(dailyData) || dailyData.length === 0) 
    return 0;

  const totalCalories = dailyData.reduce((sum, day) => sum + (day.cal || 0), 0);        
  return Math.round(totalCalories / days);
};


// 월간 평균 칼로리 계산 (해당 월의 실제 일수로 자동 계산)
export const calculateMonthlyAvgCalories = (dailyData) => {
  if (!dailyData || !Array.isArray(dailyData) || dailyData.length === 0)
    return 0;
  
  const firstDate = dailyData[0]?.date;
  if (!firstDate)
    return 0;
  
  const [year, month] = firstDate.split('-');
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const totalCalories = dailyData.reduce((sum, day) => sum + (day.cal || 0), 0);
  return Math.round(totalCalories / daysInMonth);
};

// 월간 목표 달성일 계산 (자동으로 해당 월 일수 계산하여 일일 목표로 변환)
export const calculateMonthlyAchievedDays = (dailyData, monthlyGoal) => {
  if (!dailyData || !Array.isArray(dailyData) || dailyData.length === 0) return 0;
  if (!monthlyGoal?.cal) return 0;
  
  // 해당 월의 실제 일수 계산
  const firstDate = dailyData[0]?.date;
  if (!firstDate) return 0;
  
  const [year, month] = firstDate.split('-');
  const daysInMonth = new Date(year, month, 0).getDate();
  
  // 월간 목표를 일일 목표로 변환
  const dailyGoalCal = monthlyGoal.cal / daysInMonth;
  
  // 일일 목표와 비교하여 달성일 계산
  return dailyData.filter(day => (day.cal || 0) >= dailyGoalCal).length;
};

// 날짜별 데이터 집계 (WeeklyTab, MonthlyTab 공통 사용)
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

// 월간 식단 기록률 계산
export const calculateMonthlyRecordRate = (dailyData) => {
  if (!dailyData || !Array.isArray(dailyData) || dailyData.length === 0) return 0;
  
  // 해당 월의 실제 일수 계산
  const firstDate = dailyData[0]?.date;
  if (!firstDate) return 0;
  
  const [year, month] = firstDate.split('-');
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  
  // 실제 기록된 날 수 (칼로리가 0보다 큰 날)
  const recordedDays = dailyData.filter(d => (d.cal || 0) > 0).length;
  
  // 전체 월 일수 대비 기록된 날의 비율
  return Math.round((recordedDays / totalDaysInMonth) * 100);
};