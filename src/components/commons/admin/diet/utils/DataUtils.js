import { storage } from "../../../../../utils/storage";
import { filterUsers } from "./FilterUtils";
import { getMealTypes } from "./StatsCalculator";

// 공통 데이터 가져오기 패턴
export const getFilteredUsersAndRecords = (ageGroup = '전체', gender = '전체') => {
    const allUsers = storage.getActiveUsers();
    const users = filterUsers(allUsers, ageGroup, gender);
    const dietRecords = storage.get('dietRecords') || {};
    
    return { users, dietRecords };
};

// 사용자 기록 가져오기 헬퍼
export const getUserRecords = (user, dietRecords) => {
    const userKey = user.userKey || user.id;
    return dietRecords[userKey] || [];
};

// 날짜 범위에 해당하는 기록 필터링
export const getRecordsInDateRange = (userRecords, dates) => {
    if (Array.isArray(dates)) {
        return userRecords.filter(record => dates.includes(record.date));
    } else {
        return userRecords.filter(record => record.date === dates);
    }
};

// 특정 날짜 기록 가져오기
export const getRecordsForDate = (userRecords, date) => {
    return userRecords.filter(record => record.date === date);
};

// 식사 타입별 기록 가져오기
export const getRecordsByMealType = (userRecords, mealType) => {
    return userRecords.filter(record => record.mealType === mealType);
};

// 활성 사용자 수 계산 (특정 날짜/날짜범위에서)
export const getActiveUsersCount = (users, dietRecords, dates) => {
    return users.filter(user => {
        const userRecords = getUserRecords(user, dietRecords);
        const relevantRecords = getRecordsInDateRange(userRecords, dates);
        return relevantRecords.length > 0;
    }).length;
};

// 공통 차트 데이터 준비 함수
export const prepareChartData = ({
    ageGroup = '전체',
    gender = '전체',
    selectedDate,
    dateRange = null, // 날짜 배열 또는 단일 날짜
    processor // 데이터 처리 함수
}) => {
    const { users, dietRecords } = getFilteredUsersAndRecords(ageGroup, gender);
    const dates = dateRange || selectedDate;
    
    return processor({ users, dietRecords, dates });
};

// 식사 완성도 계산 헬퍼
export const calculateMealCompletionStats = (users, dietRecords, dates) => {
    const mealTypes = getMealTypes();
    const mealStats = {};
    
    mealTypes.forEach(mealType => {
        let usersWithMeal = 0;
        
        users.forEach(user => {
            const userRecords = getUserRecords(user, dietRecords);
            const relevantRecords = getRecordsInDateRange(userRecords, dates);
            
            const hasMealRecord = relevantRecords.some(record => 
                record.mealType === mealType
            );
            
            if (hasMealRecord) {
                usersWithMeal++;
            }
        });
        
        mealStats[mealType] = {
            count: usersWithMeal,
            rate: users.length > 0 ? (usersWithMeal / users.length) * 100 : 0
        };
    });
    
    return mealStats;
};

// 인기 음식 계산 헬퍼
export const calculatePopularFoods = (users, dietRecords, dates, topCount = 10) => {
    const foodCounts = {};
    
    users.forEach(user => {
        const userRecords = getUserRecords(user, dietRecords);
        const relevantRecords = getRecordsInDateRange(userRecords, dates);
        
        relevantRecords.forEach(record => {
            if (record.foodName) {
                foodCounts[record.foodName] = (foodCounts[record.foodName] || 0) + 1;
            }
        });
    });
    
    return Object.entries(foodCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, topCount)
        .map(([food, count]) => ({ food, count }));
};