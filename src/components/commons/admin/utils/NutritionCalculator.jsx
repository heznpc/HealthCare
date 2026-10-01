// 영양소 및 목표 계산 유틸리티

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

/* ===== 기존 useDietData의 targetsFromKcal 로직 유지 (하위 호환성) ===== */
export const targetsFromKcal = (kcal = 0) => ({
  cal: kcal,
  carb: kcal ? Math.round((kcal * 0.5) / 4) : 0,
  protein: kcal ? Math.round((kcal * 0.3) / 4) : 0,
  fat: kcal ? Math.round((kcal * 0.2) / 9) : 0,
});