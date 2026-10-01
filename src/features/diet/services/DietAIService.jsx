import { localData } from "../../../utils/indexedStore.mjs";
// Diet AI 관련 API 서비스

/* ===== 환경변수 ===== */
const OPENAI_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const G_KEY = process.env.REACT_APP_GOOGLE_SEARCH_KEY;
const G_CX = process.env.REACT_APP_GOOGLE_CX_KEY;

/* ===== OpenAI 식단 JSON 생성 ===== */
export async function getMealPlanFromOpenAI({ user, targets, dietStyle = "general", weightData = null }) {
  const lastMeals = JSON.parse(localData.getItem("lastMeals") || "[]");

  // 체중 목표에 따른 칼로리 조정
  let adjustedCalories = targets.tdee;
  if (weightData && weightData.weightToGoal !== null) {
    if (weightData.weightToGoal > 5) {
      adjustedCalories = Math.round(targets.tdee * 0.85); // 감량 모드
    } else if (weightData.weightToGoal < -5) {
      adjustedCalories = Math.round(targets.tdee * 1.15); // 증량 모드
    } else if (weightData.weightToGoal > 2) {
      adjustedCalories = Math.round(targets.tdee * 0.92); // 완만한 감량
    } else if (weightData.weightToGoal < -2) {
      adjustedCalories = Math.round(targets.tdee * 1.08); // 완만한 증량
    }
  }

  const schemaHint = `{
  "goalKcal": ${adjustedCalories} (반드시 이 칼로리 목표로 설정),
  "breakfast": {"title": string, "calories": number, "protein": number, "carbs": number, "fat": number, "items": [string]},
  "lunch":     {"title": string, "calories": number, "protein": number, "carbs": number, "fat": number, "items": [string]},
  "dinner":    {"title": string, "calories": number, "protein": number, "carbs": number, "fat": number, "items": [string]}
}`;

  // 식단 스타일별 가이드라인
  const dietStyleGuide = {
    general: "균형 잡힌 탄수화물(50%), 단백질(30%), 지방(20%) 구성. 일반적인 한국 식사 스타일로 구성.",
    training: "단백질 비중을 높여(40%) 근육 성장에 집중. 닭가슴살, 계란, 생선, 콩류 위주. 탄수화물(35%), 지방(25%).",
    keto: "탄수화물을 최소화(5-10%)하고 건강한 지방(70-75%), 단백질(20-25%) 중심. 아보카도, 견과류, 올리브오일, 고기, 생선 위주. 밥, 면, 빵 제외.",
    vegan: "동물성 식품 완전 배제. 콩류, 견과류, 채소, 과일, 곡물 위주. 단백질은 두부, 콩, 퀴노아에서 확보."
  };

  const styleInstruction = dietStyleGuide[dietStyle] || dietStyleGuide.general;

  // 체중 정보 준비
  const baseWeight = user.startWeight || user.weight;
  const currentWeight = weightData?.currentWeight || baseWeight;
  let weightInfo = `${currentWeight}kg`;
  
  if (weightData && weightData.recordCount > 1) {
    const changeText = weightData.totalChange > 0 
      ? `+${weightData.totalChange.toFixed(1)}kg` 
      : `${weightData.totalChange.toFixed(1)}kg`;
    weightInfo += ` (시작: ${weightData.startWeight}kg, 변화: ${changeText})`;
    
    if (Math.abs(weightData.recentChange) > 0.5) {
      const trendText = weightData.trend === "증가" ? "증가 추세" : 
                       weightData.trend === "감소" ? "감소 추세" : "유지";
      weightInfo += `, 최근 추세: ${trendText}`;
    }
    
    // 목표 체중까지의 거리
    if (weightData.targetWeight && weightData.weightToGoal !== null) {
      const goalDistance = Math.abs(weightData.weightToGoal);
      const goalDirection = weightData.weightToGoal > 0 ? "감량" : "증량";
      weightInfo += `, 목표까지 ${goalDistance.toFixed(1)}kg ${goalDirection} 필요`;
    }
  }

  // 특별 지시사항만 설정 (칼로리는 이미 위에서 조정됨)
  let specialInstructions = "";
  
  if (weightData && weightData.weightToGoal !== null) {
    if (weightData.weightToGoal > 5) {
      specialInstructions = "감량을 위해 저칼로리 고단백 음식 위주, 포만감 높은 채소와 식이섬유 풍부한 음식 선택";
    } else if (weightData.weightToGoal < -5) {
      specialInstructions = "건강한 증량을 위해 고칼로리 영양가 있는 음식 위주: 견과류, 아보카도, 올리브오일, 연어, 닭가슴살, 퀴노아, 고구마 등. 작은 용량이지만 칼로리 밀도 높은 음식 선택";
    } else if (weightData.weightToGoal > 2) {
      specialInstructions = "완만한 감량을 위해 균형잡힌 영양소 비율 유지하되 정제탄수화물 줄이고 단백질 비중 높임";
    } else if (weightData.weightToGoal < -2) {
      specialInstructions = "완만한 증량을 위해 건강한 지방과 복합탄수화물 비중 높임, 간식으로 견과류나 과일 추가";
    }
  }

  const prompt = `
    너는 한국 사용자의 1일 식단 코치다.
    사용자: ${user.age}세, ${user.heightCm || user.height}cm, ${weightInfo}, ${user.gender || user.sex}, 활동:${user.activityKey || user.activity}.
    목표: 총 ${adjustedCalories} kcal (BMR ${targets.bmr}).
    식단 스타일: ${dietStyle} - ${styleInstruction}
    ${specialInstructions ? `특별 지시: ${specialInstructions}` : ""}
    조건:
    - 아침/점심/저녁 3끼 총합이 정확히 ${adjustedCalories}kcal가 되도록 구성.
    - 각 끼니별 calories/protein/carbs/fat 숫자 포함.
    - 메뉴는 한국인이 먹기 쉬운 간단식.
    - 식단 스타일에 맞는 영양소 비율과 식재료 사용.
    - 체중 변화 추세를 고려한 식단 조절 (증가 추세면 칼로리 조절, 감소 추세면 영양 보충).
    - 목표 체중 달성을 위한 맞춤형 식단 제공.
    - 최근 추천된 음식(${lastMeals.join(", ")})은 제외.
    - ${schemaHint}
    반드시 JSON만 응답. 설명 금지.
  `.trim();

  console.log("OpenAI API 호출 시작...");
  
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "Authorization": `Bearer ${OPENAI_KEY}` 
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        { role: "system", content: "Return STRICT JSON only. No prose." },
        { role: "user", content: prompt }
      ]
    })
  });

  const data = await res.json();
  
  if (!res.ok) {
    console.error("OpenAI API 오류:", {
      status: res.status,
      statusText: res.statusText,
      error: data?.error
    });
    
    if (res.status === 429) {
      console.warn("OpenAI API 429 에러: 할당량 초과 또는 요청 제한");
    }
    
    throw new Error(data?.error?.message || `OpenAI 실패 (${res.status})`);
  }
  
  console.log("OpenAI API 성공");

  const txt = String(data?.choices?.[0]?.message?.content || "{}").replace(/```json|```/g, "");
  const parsed = JSON.parse(txt);

  // 최근 음식 기록 업데이트
  const allMeals = [
    ...(parsed.breakfast?.items || []),
    ...(parsed.lunch?.items || []),
    ...(parsed.dinner?.items || [])
  ];
  localData.setItem("lastMeals", JSON.stringify(allMeals.slice(0, 15)));

  return parsed;
}

/* ===== Google 이미지 검색 ===== */
export async function googleImageTop2(query) {
  if (!G_KEY || !G_CX) {
    console.warn("Google API 키가 설정되지 않음");
    return [];
  }
  
  console.log(`Google 이미지 검색 시작: "${query}"`);
  
  const url = `https://www.googleapis.com/customsearch/v1?` + new URLSearchParams({
    key: G_KEY, 
    cx: G_CX, 
    q: query, 
    searchType: "image", 
    num: "5", 
    safe: "active"
  });

  const res = await fetch(url);
  const data = await res.json();
  
  if (!res.ok || data.error) {
    console.error("Google API 오류:", {
      status: res.status,
      statusText: res.statusText,
      error: data.error,
      query: query
    });
    
    if (res.status === 429) {
      console.warn("Google API 429 에러: 일일 할당량 초과 (100회/일)");
    }
    
    throw new Error(data?.error?.message || `Google 검색 실패 (${res.status})`);
  }
  
  const links = (data.items || []).map(it => it.link).filter(Boolean);
  console.log(`Google 이미지 검색 성공: ${links.length}개 찾음`);
  
  return links.slice(0, 2);
}

/* ===== 통합 식단 추천 서비스 ===== */
export async function generateMealPlan(user, targets, dietStyle = "general", weightData = null) {
  console.log("식단 추천 서비스 시작:", { dietStyle, targetCalories: targets?.tdee, weightData });
  
  try {
    const plan = await getMealPlanFromOpenAI({ user, targets, dietStyle, weightData });

    const qB = plan.breakfast?.title || plan.breakfast?.items?.[0] || "한식 아침";
    const qL = plan.lunch?.title || plan.lunch?.items?.[0] || "한식 점심";
    const qD = plan.dinner?.title || plan.dinner?.items?.[0] || "한식 저녁";

    console.log("이미지 검색 시작:", { 아침: qB, 점심: qL, 저녁: qD });

    const [bImgs, lImgs, dImgs] = await Promise.all([
      googleImageTop2(qB).catch((err) => {
        console.warn("아침 이미지 검색 실패:", err.message);
        return [];
      }),
      googleImageTop2(qL).catch((err) => {
        console.warn("점심 이미지 검색 실패:", err.message);
        return [];
      }),
      googleImageTop2(qD).catch((err) => {
        console.warn("저녁 이미지 검색 실패:", err.message);
        return [];
      }),
    ]);

    console.log("식단 추천 완료:", { 
      이미지: { 아침: bImgs.length, 점심: lImgs.length, 저녁: dImgs.length } 
    });

    return {
      breakfast: { 
        title: "아침", 
        subtitle: plan.breakfast?.title, 
        items: plan.breakfast?.items || [], 
        macros: {
          calories: plan.breakfast?.calories, 
          protein: plan.breakfast?.protein, 
          carbs: plan.breakfast?.carbs, 
          fat: plan.breakfast?.fat
        }, 
        imageUrls: bImgs 
      },
      lunch: { 
        title: "점심", 
        subtitle: plan.lunch?.title, 
        items: plan.lunch?.items || [], 
        macros: {
          calories: plan.lunch?.calories, 
          protein: plan.lunch?.protein, 
          carbs: plan.lunch?.carbs, 
          fat: plan.lunch?.fat
        }, 
        imageUrls: lImgs 
      },
      dinner: { 
        title: "저녁", 
        subtitle: plan.dinner?.title, 
        items: plan.dinner?.items || [], 
        macros: {
          calories: plan.dinner?.calories, 
          protein: plan.dinner?.protein, 
          carbs: plan.dinner?.carbs, 
          fat: plan.dinner?.fat
        }, 
        imageUrls: dImgs 
      },
    };
    
  } catch (error) {
    console.error("식단 추천 서비스 전체 실패:", error);
    throw error;
  }
}