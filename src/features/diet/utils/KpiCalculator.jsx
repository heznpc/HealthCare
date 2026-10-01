// KPI 계산 유틸리티

/* ===== 주간 KPI 계산 함수들 ===== */

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

/* ===== 월간 KPI 계산 함수들 ===== */

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