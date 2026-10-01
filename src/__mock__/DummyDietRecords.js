import { localData } from "../utils/indexedStore.mjs";
// 관리자 모드 테스트용 식이 기록 더미 데이터
const generateDummyDietRecords = () => {
    const dietRecords = {};
    
    // 음식 데이터
    const foods = [
        { name: "백미", cal: 130, protein: 2.5, carbs: 28, fat: 0.3 },
        { name: "현미", cal: 111, protein: 2.3, carbs: 23, fat: 0.9 },
        { name: "닭가슴살", cal: 165, protein: 31, carbs: 0, fat: 3.6 },
        { name: "삼겹살", cal: 518, protein: 17, carbs: 0, fat: 49 },
        { name: "계란", cal: 155, protein: 13, carbs: 1.1, fat: 11 },
        { name: "브로콜리", cal: 34, protein: 2.8, carbs: 7, fat: 0.4 },
        { name: "시금치", cal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
        { name: "바나나", cal: 89, protein: 1.1, carbs: 23, fat: 0.3 },
        { name: "사과", cal: 52, protein: 0.3, carbs: 14, fat: 0.2 },
        { name: "아보카도", cal: 160, protein: 2, carbs: 9, fat: 15 },
        { name: "연어", cal: 208, protein: 20, carbs: 0, fat: 13 },
        { name: "참치", cal: 184, protein: 30, carbs: 0, fat: 6 },
        { name: "두부", cal: 76, protein: 8, carbs: 1.9, fat: 4.8 },
        { name: "김치", cal: 18, protein: 2, carbs: 2.4, fat: 0.5 },
        { name: "고구마", cal: 86, protein: 1.6, carbs: 20, fat: 0.1 },
        { name: "감자", cal: 77, protein: 2, carbs: 17, fat: 0.1 },
        { name: "우유", cal: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
        { name: "요거트", cal: 59, protein: 10, carbs: 3.6, fat: 0.4 },
        { name: "오트밀", cal: 389, protein: 16.9, carbs: 66, fat: 6.9 },
        { name: "견과류", cal: 607, protein: 15, carbs: 7, fat: 54 },
        { name: "파스타", cal: 131, protein: 5, carbs: 25, fat: 1.1 },
        { name: "빵", cal: 265, protein: 9, carbs: 49, fat: 3.2 },
        { name: "치킨", cal: 290, protein: 27, carbs: 0, fat: 18 },
        { name: "피자", cal: 266, protein: 11, carbs: 33, fat: 10 },
        { name: "햄버거", cal: 540, protein: 25, carbs: 40, fat: 31 },
        { name: "라면", cal: 380, protein: 10, carbs: 56, fat: 14 },
        { name: "김밥", cal: 170, protein: 4, carbs: 30, fat: 4 },
        { name: "떡볶이", cal: 240, protein: 6, carbs: 50, fat: 2 },
        { name: "치킨샐러드", cal: 180, protein: 20, carbs: 8, fat: 8 },
        { name: "프로틴쉐이크", cal: 120, protein: 25, carbs: 5, fat: 1 }
    ];

    // 식사 타입
    const mealTypes = ["아침", "점심", "저녁", "간식", "야식"];

    // 최근 30일 날짜 생성
    const dates = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }

    // MEMBER 역할 사용자들 (실제 활발한 사용자로 설정)
    const memberUsers = [
        "member_teen001", "member_teen002", "member_teen003",
        "member_20s001", "member_20s002", "member_20s003",
        "member_30s001", "member_30s002", "member_30s003",
        "member_40s001", "member_40s002", "member_40s003",
        "member_50s001", "member_50s002", "member_50s003",
        "member_60s001", "member_60s002", "member_60s003"
    ];

    // 일반 사용자들 중 일부 (user001~user020)
    const activeGeneralUsers = [];
    for (let i = 1; i <= 20; i++) {
        activeGeneralUsers.push(`user${String(i).padStart(3, '0')}`);
    }

    const allActiveUsers = [...memberUsers, ...activeGeneralUsers];

    // 각 활성 사용자별로 식이 기록 생성
    allActiveUsers.forEach(userKey => {
        dietRecords[userKey] = [];

        dates.forEach(date => {
            // 80% 확률로 해당 날짜에 기록 있음
            if (Math.random() > 0.2) {
                
                // 아침 (70% 확률)
                if (Math.random() > 0.3) {
                    const morningFoods = getRandomFoods(foods, 1, 3);
                    const morningTime = `0${6 + Math.floor(Math.random() * 4)}:${Math.floor(Math.random() * 6) * 10}0`.slice(-5); // 06:00-09:50
                    morningFoods.forEach(food => {
                        dietRecords[userKey].push({
                            id: `${userKey}_${date}_morning_${food.name}`,
                            userKey: userKey,
                            date: date,
                            time: morningTime,
                            mealType: "아침",
                            foodName: food.name,
                            quantity: Math.floor(Math.random() * 3) + 1,
                            energy: food.cal, // aggregate 함수에서 energy 필드를 사용
                            protein: food.protein,
                            carb: food.carbs, // aggregate 함수에서 carb 필드를 사용
                            fat: food.fat,
                            createdAt: date
                        });
                    });
                }

                // 점심 (90% 확률)
                if (Math.random() > 0.1) {
                    const lunchFoods = getRandomFoods(foods, 2, 4);
                    const lunchTime = `${11 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 6) * 10}0`; // 11:00-13:50
                    lunchFoods.forEach(food => {
                        dietRecords[userKey].push({
                            id: `${userKey}_${date}_lunch_${food.name}`,
                            userKey: userKey,
                            date: date,
                            time: lunchTime,
                            mealType: "점심",
                            foodName: food.name,
                            quantity: Math.floor(Math.random() * 3) + 1,
                            energy: food.cal, // aggregate 함수에서 energy 필드를 사용
                            protein: food.protein,
                            carb: food.carbs, // aggregate 함수에서 carb 필드를 사용
                            fat: food.fat,
                            createdAt: date
                        });
                    });
                }

                // 저녁 (85% 확률)
                if (Math.random() > 0.15) {
                    const dinnerFoods = getRandomFoods(foods, 2, 4);
                    const dinnerTime = `${17 + Math.floor(Math.random() * 4)}:${Math.floor(Math.random() * 6) * 10}0`; // 17:00-20:50
                    dinnerFoods.forEach(food => {
                        dietRecords[userKey].push({
                            id: `${userKey}_${date}_dinner_${food.name}`,
                            userKey: userKey,
                            date: date,
                            time: dinnerTime,
                            mealType: "저녁",
                            foodName: food.name,
                            quantity: Math.floor(Math.random() * 3) + 1,
                            energy: food.cal, // aggregate 함수에서 energy 필드를 사용
                            protein: food.protein,
                            carb: food.carbs, // aggregate 함수에서 carb 필드를 사용
                            fat: food.fat,
                            createdAt: date
                        });
                    });
                }

                // 간식 (40% 확률)
                if (Math.random() > 0.6) {
                    const snackFoods = getRandomFoods(foods.filter(f => 
                        ["바나나", "사과", "요거트", "견과류", "프로틴쉐이크"].includes(f.name)
                    ), 1, 2);
                    const snackTime = `${14 + Math.floor(Math.random() * 4)}:${Math.floor(Math.random() * 6) * 10}0`; // 14:00-17:50
                    snackFoods.forEach(food => {
                        dietRecords[userKey].push({
                            id: `${userKey}_${date}_snack_${food.name}`,
                            userKey: userKey,
                            date: date,
                            time: snackTime,
                            mealType: "간식",
                            foodName: food.name,
                            quantity: 1,
                            energy: food.cal, // aggregate 함수에서 energy 필드를 사용
                            protein: food.protein,
                            carb: food.carbs, // aggregate 함수에서 carb 필드를 사용
                            fat: food.fat,
                            createdAt: date
                        });
                    });
                }

                // 야식 (15% 확률)
                if (Math.random() > 0.85) {
                    const lateNightFoods = getRandomFoods(foods.filter(f => 
                        ["라면", "치킨", "피자", "햄버거", "떡볶이"].includes(f.name)
                    ), 1, 2);
                    const lateNightTime = `${21 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 6) * 10}0`; // 21:00-23:50
                    lateNightFoods.forEach(food => {
                        dietRecords[userKey].push({
                            id: `${userKey}_${date}_latenight_${food.name}`,
                            userKey: userKey,
                            date: date,
                            time: lateNightTime,
                            mealType: "야식",
                            foodName: food.name,
                            quantity: 1,
                            energy: food.cal, // aggregate 함수에서 energy 필드를 사용
                            protein: food.protein,
                            carb: food.carbs, // aggregate 함수에서 carb 필드를 사용
                            fat: food.fat,
                            createdAt: date
                        });
                    });
                }
            }
        });
    });

    return dietRecords;
};

// 랜덤 음식 선택 헬퍼 함수
const getRandomFoods = (foods, minCount, maxCount) => {
    const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
    const shuffled = [...foods].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

// 더미 데이터를 localStorage에 저장하는 함수
export const loadDummyDietData = () => {
    const dummyData = generateDummyDietRecords();
    localData.setItem('dietRecords', JSON.stringify(dummyData));
    console.log('더미 식이 기록 데이터가 로드되었습니다!');
    console.log(`총 ${Object.keys(dummyData).length}명의 사용자 데이터 생성`);
    
    // 총 기록 수 계산
    let totalRecords = 0;
    Object.values(dummyData).forEach(records => {
        totalRecords += records.length;
    });
    console.log(`총 ${totalRecords}개의 식이 기록 생성`);
};

export default generateDummyDietRecords;