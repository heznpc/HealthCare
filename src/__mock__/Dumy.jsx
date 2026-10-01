import { localData } from "../utils/indexedStore.mjs";
  // src/utils/generateDummyFoods.js
  export function generateDummyFoods({
    userKey = "1524",         // 로그인 없어도 고정 키로 저장
    count = 50,
    start = "2025-07-01",
    end = "2025-09-30",
    reset = false,            // true면 기존 기록 삭제 후 채움
  } = {}) {
    const recordsKey = "dietRecords";

    // 음식 데이터(문자열 포맷 유지)
    const foods = [
      { name: "김밥_김치", energy: "130.000", protein: "19.17", fat: "4.03", carb: "1.29" },
      { name: "국밥_돼지머리", energy: "137.000", protein: "15.94", fat: "5.16", carb: "0.63" },
      { name: "국밥_콩나물", energy: "52.000", protein: "10.93", fat: "0.24", carb: "0.56" },
      { name: "샐러드_치킨", energy: "220.000", protein: "28.00", fat: "8.00", carb: "5.00" },
      { name: "토스트_햄치즈", energy: "280.000", protein: "12.00", fat: "10.00", carb: "34.00" },
      { name: "라면", energy: "500.000", protein: "10.00", fat: "15.00", carb: "80.00" },
      { name: "계란후라이", energy: "90.000", protein: "6.00", fat: "7.00", carb: "0.50" },
      { name: "고구마", energy: "110.000", protein: "2.00", fat: "0.00", carb: "26.00" },
      { name: "바나나", energy: "89.000", protein: "1.10", fat: "0.30", carb: "23.00" },
      { name: "닭가슴살", energy: "165.000", protein: "31.00", fat: "3.60", carb: "0.00" },
      { name: "잡곡밥", energy: "210.000", protein: "5.00", fat: "1.50", carb: "45.00" },
      { name: "된장찌개", energy: "150.000", protein: "9.00", fat: "6.00", carb: "12.00" },
      { name: "김치찌개", energy: "180.000", protein: "11.00", fat: "7.00", carb: "14.00" },
      { name: "삼겹살", energy: "400.000", protein: "27.00", fat: "35.00", carb: "0.00" },
      { name: "불고기", energy: "280.000", protein: "20.00", fat: "18.00", carb: "8.00" },
      { name: "치킨", energy: "320.000", protein: "25.00", fat: "20.00", carb: "10.00" },
      { name: "피자", energy: "300.000", protein: "15.00", fat: "12.00", carb: "34.00" },
      { name: "햄버거", energy: "450.000", protein: "22.00", fat: "20.00", carb: "50.00" },
      { name: "스파게티", energy: "350.000", protein: "12.00", fat: "10.00", carb: "60.00" },
      { name: "초밥", energy: "250.000", protein: "15.00", fat: "5.00", carb: "40.00" },
      { name: "샌드위치", energy: "280.000", protein: "14.00", fat: "8.00", carb: "38.00" },
      { name: "과일샐러드", energy: "120.000", protein: "2.00", fat: "1.00", carb: "30.00" },
      { name: "두부조림", energy: "150.000", protein: "12.00", fat: "7.00", carb: "8.00" },
      { name: "미역국", energy: "80.000", protein: "5.00", fat: "3.00", carb: "6.00" },
      { name: "어묵탕", energy: "130.000", protein: "8.00", fat: "4.00", carb: "15.00" },
      { name: "떡볶이", energy: "300.000", protein: "6.00", fat: "6.00", carb: "60.00" },
      { name: "순대", energy: "200.000", protein: "9.00", fat: "8.00", carb: "24.00" },
      { name: "호박죽", energy: "180.000", protein: "3.00", fat: "2.00", carb: "40.00" },
      { name: "팥죽", energy: "220.000", protein: "6.00", fat: "2.00", carb: "48.00" },
      { name: "우유", energy: "130.000", protein: "8.00", fat: "7.00", carb: "10.00" },
      { name: "요거트", energy: "150.000", protein: "5.00", fat: "4.00", carb: "20.00" },
    ];

    const mealTypes = ["아침", "점심", "저녁", "간식"];

    const allData = JSON.parse(localData.getItem(recordsKey) || "{}");
    const existing = allData[userKey] || [];

    // 이미 존재하면 중복 주입 방지 (reset로 강제 초기화 가능)
    if (!reset && existing.length > 0) {
      console.log("ℹ️ 이미 데이터가 있어 더미 주입을 건너뜁니다. (reset=true로 초기화 가능)");
      return;
    }

    // 초기화
    const userData = reset ? [] : existing.slice();

    // 날짜 범위
    const startDate = new Date(start);
    const endDate = new Date(end);
    const randDate = () =>
      new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));

    for (let i = 0; i < count; i++) {
      const food = foods[Math.floor(Math.random() * foods.length)];
      const mealType = mealTypes[Math.floor(Math.random() * mealTypes.length)];
      const dateStr = randDate().toISOString().split("T")[0];
      const quantity = Math.ceil(Math.random() * 3);

      userData.push({
        id: Date.now() + i,
        ...food,
        date: dateStr,
        mealType,
        quantity,
      });
    }

    allData[userKey] = userData;
    localData.setItem(recordsKey, JSON.stringify(allData));
    console.log(`✅ 더미 ${count}개 주입 완료 (범위: ${start} ~ ${end}, key=${userKey})`);
  }
