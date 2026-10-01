// 칼로리 구간 상수들

// 일간 칼로리 분포용 (상세 구간)
export const DAILY_CALORIE_RANGES = [
    { min: 0, max: 500, label: '0-500kcal' },
    { min: 500, max: 1000, label: '500-1000kcal' },
    { min: 1000, max: 1500, label: '1000-1500kcal' },
    { min: 1500, max: 2000, label: '1500-2000kcal' },
    { min: 2000, max: 2500, label: '2000-2500kcal' },
    { min: 2500, max: 3000, label: '2500-3000kcal' },
    { min: 3000, max: Infinity, label: '3000kcal+' }
];

// 월간 칼로리 분포용 (3단계 구간)
export const MONTHLY_CALORIE_RANGES = {
    low: { min: 0, max: 1500, label: '저칼로리 (0-1500)', color: 'rgba(34, 197, 94, 1)' },
    mid: { min: 1500, max: 2500, label: '중칼로리 (1500-2500)', color: 'rgba(251, 146, 60, 1)' },
    high: { min: 2500, max: Infinity, label: '고칼로리 (2500+)', color: 'rgba(239, 68, 68, 1)' }
};

// 칼로리 구간별 색상 팔레트
export const CALORIE_COLORS = {
    veryLow: 'rgba(34, 197, 94, 0.7)',    // 초록색 (저칼로리)
    low: 'rgba(34, 197, 94, 0.8)',        
    medium: 'rgba(251, 146, 60, 0.7)',    // 주황색 (중칼로리)
    high: 'rgba(239, 68, 68, 0.7)',       // 빨간색 (고칼로리)
    veryHigh: 'rgba(190, 18, 60, 0.7)'    // 진한 빨간색
};

// 칼로리를 구간으로 분류하는 유틸리티 함수
export const categorizeCalories = (calories) => {
    if (calories < 1500) return 'low';
    if (calories < 2500) return 'mid';
    return 'high';
};

// 칼로리 구간에 해당하는 색상 반환
export const getCalorieColor = (calories) => {
    if (calories < 500) return CALORIE_COLORS.veryLow;
    if (calories < 1500) return CALORIE_COLORS.low;
    if (calories < 2500) return CALORIE_COLORS.medium;
    if (calories < 3500) return CALORIE_COLORS.high;
    return CALORIE_COLORS.veryHigh;
};