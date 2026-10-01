// Chart.js 공통 옵션들

// 공통 축 스타일
export const COMMON_AXIS_STYLE = {
    border: { 
        display: true, 
        dash: [3, 3], 
        color: "#666", 
        width: 1 
    }
};

// 기본 차트 옵션
export const BASE_CHART_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { 
            display: true,
            position: 'top' 
        }
    }
};

// 바 차트 기본 옵션
export const BASE_BAR_OPTIONS = {
    ...BASE_CHART_OPTIONS,
    plugins: {
        ...BASE_CHART_OPTIONS.plugins,
        legend: { display: false }
    }
};

// 공통 스케일 생성 함수
export const createXAxisScale = (title, options = {}) => ({
    ...COMMON_AXIS_STYLE,
    title: {
        display: true,
        text: title
    },
    ...options
});

export const createYAxisScale = (title, unit = '', options = {}) => ({
    beginAtZero: true,
    ...COMMON_AXIS_STYLE,
    ticks: { 
        callback: (v) => `${v}${unit}`,
        ...(options.ticks || {})
    },
    title: {
        display: true,
        text: title
    },
    ...options
});

// 일반적인 차트 옵션 템플릿들
export const createLineChartOptions = (xTitle, yTitle, yUnit = '') => ({
    ...BASE_CHART_OPTIONS,
    scales: {
        x: createXAxisScale(xTitle),
        y: createYAxisScale(yTitle, yUnit)
    }
});

export const createBarChartOptions = (xTitle, yTitle, yUnit = '') => ({
    ...BASE_BAR_OPTIONS,
    scales: {
        x: createXAxisScale(xTitle, { ticks: { maxRotation: 45 } }),
        y: createYAxisScale(yTitle, yUnit, { ticks: { stepSize: 1 } })
    }
});

// 퍼센트 차트 옵션 (0-100%)
export const createPercentChartOptions = (xTitle, yTitle = '기록률 (%)') => ({
    ...BASE_BAR_OPTIONS,
    scales: {
        x: createXAxisScale(xTitle),
        y: createYAxisScale(yTitle, '%', { 
            max: 100,
            ticks: { 
                callback: (v) => `${v}%`,
                stepSize: 1
            }
        })
    }
});

// 공통 툴팁 콜백들
export const TOOLTIP_CALLBACKS = {
    // 기본 제목 콜백
    defaultTitle: (items) => {
        const i = items?.[0]?.dataIndex ?? 0;
        return items[0]?.label || '';
    },
    
    // 사용자 수 라벨
    userCount: (ctx) => `사용자 수: ${ctx.parsed.y}명`,
    
    // 퍼센트 라벨  
    percentage: (ctx) => `기록률: ${ctx.parsed.y.toFixed(1)}%`,
    
    // 칼로리 라벨
    calories: (ctx) => `칼로리: ${Math.round(ctx.parsed.y).toLocaleString()}kcal`
};