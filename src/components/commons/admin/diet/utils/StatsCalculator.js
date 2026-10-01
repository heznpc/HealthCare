import { storage } from "../../../../../utils/storage";
import { aggregate, calculateNutritionTargets } from "../../../../../features/diet/utils/NutritionUtils";

export const getMealTypes = () => {
    const dietRecords = storage.get('dietRecords') || {};
    const allMealTypes = new Set();
    
    Object.values(dietRecords).forEach(userRecords => {
        if (Array.isArray(userRecords)) {
            userRecords.forEach(record => {
                if (record.mealType) {
                    allMealTypes.add(record.mealType);
                }
            });
        }
    });
    
    return Array.from(allMealTypes);
};

export const getWeekDates = (selectedDate) => {
    const selectedDateObj = new Date(selectedDate);
    const dayOfWeek = selectedDateObj.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(selectedDateObj);
        date.setDate(selectedDateObj.getDate() + mondayOffset + i);
        weekDates.push(date.toISOString().split('T')[0]);
    }
    
    return weekDates;
};

export const getMonthDates = (selectedDate) => {
    const selectedDateObj = new Date(selectedDate);
    const year = selectedDateObj.getFullYear();
    const month = selectedDateObj.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const monthDates = [];
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        monthDates.push(date.toISOString().split('T')[0]);
    }
    
    return monthDates;
};

export const calculateDailyStats = (users, selectedDate) => {
    const dietRecords = storage.get('dietRecords') || {};
    const mealTypesArray = getMealTypes();
    
    let totalRecords = 0;
    let totalCalories = 0;
    let totalGoalAchievement = 0;
    let completedMealSlots = 0;
    let totalMealSlots = 0;
    let validUsersCount = 0;

    users.forEach(user => {
        const userKey = user.userKey || user.id;
        const userRecords = dietRecords[userKey] || [];
        
        const todayRecords = userRecords.filter(record => record.date === selectedDate);
        
        if (todayRecords.length > 0) {
            totalRecords += todayRecords.length;
            
            const dayCalories = aggregate(todayRecords).cal;
            totalCalories += dayCalories;
            
            const nutritionTargets = calculateNutritionTargets(user);
            if (nutritionTargets && nutritionTargets.cal > 0) {
                const achievementRate = (dayCalories / nutritionTargets.cal) * 100;
                totalGoalAchievement += Math.min(achievementRate, 100);
                validUsersCount++;
            }
        }
        
        mealTypesArray.forEach(mealType => {
            const mealRecords = todayRecords.filter(record => record.mealType === mealType);
            if (mealRecords.length > 0) {
                completedMealSlots++;
            }
            totalMealSlots++;
        });
    });

    const activeUsersToday = users.filter(user => {
        const userKey = user.userKey || user.id;
        const userRecords = dietRecords[userKey] || [];
        return userRecords.some(record => record.date === selectedDate);
    }).length;

    return {
        averageGoalAchievement: validUsersCount > 0 ? (totalGoalAchievement / validUsersCount) : 0,
        totalTodayRecords: totalRecords,
        averageCalories: activeUsersToday > 0 ? (totalCalories / activeUsersToday) : 0,
        mealCompletionRate: totalMealSlots > 0 ? (completedMealSlots / totalMealSlots) * 100 : 0,
        activeUsersToday,
        totalMealTypes: mealTypesArray.length
    };
};

export const calculateWeeklyStats = (users, selectedDate) => {
    const dietRecords = storage.get('dietRecords') || {};
    const weekDates = getWeekDates(selectedDate);
    const mealTypesArray = getMealTypes();
    
    let totalWeekRecords = 0;
    let totalWeekCalories = 0;
    let totalGoalAchievement = 0;
    let validUsersCount = 0;
    let activeUsersInWeek = 0;
    let totalPossibleMealSlots = 0;
    let completedMealSlots = 0;

    users.forEach(user => {
        const userKey = user.userKey || user.id;
        const userRecords = dietRecords[userKey] || [];
        
        const weekRecords = userRecords.filter(record => 
            weekDates.includes(record.date)
        );
        
        if (weekRecords.length > 0) {
            activeUsersInWeek++;
            totalWeekRecords += weekRecords.length;
            
            const weekCalories = aggregate(weekRecords).cal;
            totalWeekCalories += weekCalories;
            
            const nutritionTargets = calculateNutritionTargets(user);
            if (nutritionTargets && nutritionTargets.cal > 0) {
                const dailyTargetCalories = nutritionTargets.cal;
                const weekTargetCalories = dailyTargetCalories * 7;
                const achievementRate = (weekCalories / weekTargetCalories) * 100;
                totalGoalAchievement += Math.min(achievementRate, 100);
                validUsersCount++;
            }
            
            weekDates.forEach(date => {
                const dayRecords = weekRecords.filter(record => record.date === date);
                mealTypesArray.forEach(mealType => {
                    totalPossibleMealSlots++;
                    const mealRecords = dayRecords.filter(record => record.mealType === mealType);
                    if (mealRecords.length > 0) {
                        completedMealSlots++;
                    }
                });
            });
        }
    });

    return {
        averageGoalAchievement: validUsersCount > 0 ? (totalGoalAchievement / validUsersCount) : 0,
        totalWeekRecords: totalWeekRecords,
        averageWeeklyCalories: activeUsersInWeek > 0 ? (totalWeekCalories / activeUsersInWeek) : 0,
        mealCompletionRate: totalPossibleMealSlots > 0 ? (completedMealSlots / totalPossibleMealSlots) * 100 : 0,
        activeUsersInWeek,
        totalMealTypes: mealTypesArray.length,
        weekRange: `${weekDates[0]} ~ ${weekDates[6]}`
    };
};

export const calculateMonthlyStats = (users, selectedDate) => {
    const dietRecords = storage.get('dietRecords') || {};
    const monthDates = getMonthDates(selectedDate);
    const mealTypesArray = getMealTypes();
    
    let totalMonthRecords = 0;
    let totalMonthCalories = 0;
    let totalGoalAchievement = 0;
    let validUsersCount = 0;
    let activeUsersInMonth = 0;
    let totalPossibleMealSlots = 0;
    let completedMealSlots = 0;

    users.forEach(user => {
        const userKey = user.userKey || user.id;
        const userRecords = dietRecords[userKey] || [];
        
        const monthRecords = userRecords.filter(record => 
            monthDates.includes(record.date)
        );
        
        if (monthRecords.length > 0) {
            activeUsersInMonth++;
            totalMonthRecords += monthRecords.length;
            
            const monthCalories = aggregate(monthRecords).cal;
            totalMonthCalories += monthCalories;
            
            const nutritionTargets = calculateNutritionTargets(user);
            if (nutritionTargets && nutritionTargets.cal > 0) {
                const dailyTargetCalories = nutritionTargets.cal;
                const monthTargetCalories = dailyTargetCalories * monthDates.length;
                const achievementRate = (monthCalories / monthTargetCalories) * 100;
                totalGoalAchievement += Math.min(achievementRate, 100);
                validUsersCount++;
            }
            
            monthDates.forEach(date => {
                const dayRecords = monthRecords.filter(record => record.date === date);
                mealTypesArray.forEach(mealType => {
                    totalPossibleMealSlots++;
                    const mealRecords = dayRecords.filter(record => record.mealType === mealType);
                    if (mealRecords.length > 0) {
                        completedMealSlots++;
                    }
                });
            });
        }
    });

    const selectedDateObj = new Date(selectedDate);
    const year = selectedDateObj.getFullYear();
    const month = selectedDateObj.getMonth();

    return {
        averageGoalAchievement: validUsersCount > 0 ? (totalGoalAchievement / validUsersCount) : 0,
        totalMonthRecords: totalMonthRecords,
        averageMonthlyCalories: activeUsersInMonth > 0 ? (totalMonthCalories / activeUsersInMonth) : 0,
        mealCompletionRate: totalPossibleMealSlots > 0 ? (completedMealSlots / totalPossibleMealSlots) * 100 : 0,
        activeUsersInMonth,
        totalMealTypes: mealTypesArray.length,
        monthRange: `${year}년 ${month + 1}월 (${monthDates.length}일)`
    };
};