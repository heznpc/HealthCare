// 추천식단 뷰
import { useEffect, useMemo, useState } from "react";
import styles from "../css/ChatDietRecommender.module.css";
import { useAuth } from "../../../auth/useAuth";
import { calculateNutritionTargets } from "../utils/NutritionCalculator";
import { generateMealPlan } from "../services/DietAIService";
import useDietData from "../hooks/UseDietData";
import Skeleton from "../../../components/commons/loadingUI/Skeleton";
import { storage } from "../../../utils/storage";

// 식단 스타일 라벨 매핑
function getDietStyleLabel(style) {
  const labels = {
    general: "일반 (균형)",
    training: "운동 (고단백)",
    keto: "키토 (저탄수)",
    vegan: "비건 (식물성)"
  };
  return labels[style] || "일반";
}

function MealCard({ title, subtitle, items = [], macros, imageUrls = [] }) {
  const [idx, setIdx] = useState(0);
  const [allImagesFailed, setAllImagesFailed] = useState(imageUrls.length === 0);
  const [imageLoading, setImageLoading] = useState(imageUrls.length > 0);
  const src = imageUrls[idx] || "";

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    const nextIdx = idx + 1;
    if (nextIdx < imageUrls.length) {
      setIdx(nextIdx);
      setImageLoading(true); // 다음 이미지 로딩 시작
    } else {
      // 모든 이미지가 실패했음을 표시
      setAllImagesFailed(true);
      setImageLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardImageBox}>
        {src && !allImagesFailed ? (
          <>
            {imageLoading && (
              <div className={styles.imageLoading}>
                이미지 로딩 중...
              </div>
            )}
            <img
              src={src}
              alt={title}
              className={styles.cardImage}
              style={{ display: imageLoading ? 'none' : 'block' }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </>
        ) : (
          <div className={styles.noImage}>
            <div className={styles.noImageContent}>
              📷 이미지 없음
            </div>
          </div>
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardHead}>
          <h4 className={styles.title}>{title}</h4>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>

        {macros && (
          <div className={styles.macros}>
            <span>열량 <b>{macros.calories ?? "-"}</b> kcal</span>
            <span>탄수화물 <b>{macros.carbs ?? "-"}</b> g</span>
            <span>단백질 <b>{macros.protein ?? "-"}</b> g</span>
            <span>지방 <b>{macros.fat ?? "-"}</b> g</span>
          </div>
        )}

        {items.length > 0 && (
          <ul className={styles.items}>
            {items.map((x, i) => (
              <li key={i} style={{ margin: "4px 0" }}>{x}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


/* ===== 메인 컴포넌트 ===== */
function ChatDietRecommender() {
  const { user } = useAuth();
  const { goal, goalData } = useDietData(user, { mode: "day" }); // 기존 시스템의 목표 데이터 사용
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [cards, setCards] = useState({ breakfast: null, lunch: null, dinner: null });

  // useDietData의 목표를 우선 사용, 없으면 사용자 프로필에서 계산
  const targets = useMemo(() => {
    // useDietData에서 목표가 있으면 그것을 사용
    if (goal && goal.cal > 0) {
      return {
        tdee: goal.cal,
        bmr: Math.round(goal.cal * 0.7), // 대략적인 BMR 계산
        proteinG: goal.protein,
        carbG: goal.carb,
        fatG: goal.fat
      };
    }
    // 없으면 사용자 프로필에서 계산
    return calculateNutritionTargets(user);
  }, [user, goal]);

  // 식단 스타일 가져오기
  const dietStyle = goalData?.dietStyle || "general";

  // 목표 체중 정보 가져오기
  const targetWeight = useMemo(() => {
    return user?.targetWeight || goalData?.targetWeight || null;
  }, [user, goalData]);

  // 체중 기록 분석
  const weightAnalysis = useMemo(() => {
    const userKey = user?.userKey || "guest";
    const allWeightRecords = storage.get("weightRecords") || {};
    const userRecords = (allWeightRecords[userKey] || []).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (userRecords.length === 0) {
      return null;
    }

    const currentWeight = userRecords[userRecords.length - 1].weight;
    const startWeight = userRecords[0].weight;
    const totalChange = currentWeight - startWeight;
    
    // 최근 7일간의 변화
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRecords = userRecords.filter(r => new Date(r.date) >= sevenDaysAgo);
    
    let recentChange = 0;
    let trend = "유지";
    if (recentRecords.length >= 2) {
      recentChange = recentRecords[recentRecords.length - 1].weight - recentRecords[0].weight;
      if (recentChange > 0.5) {
        trend = "증가";
      } else if (recentChange < -0.5) {
        trend = "감소";
      }
    }

    return {
      currentWeight,
      startWeight,
      totalChange,
      recentChange,
      trend,
      recordCount: userRecords.length,
      targetWeight: targetWeight,
      weightToGoal: targetWeight ? currentWeight - targetWeight : null
    };
  }, [user, targetWeight]);


  const fetchAll = async () => {
    try {
      setLoading(true); 
      setErr("");
      
      if (!user || !targets) {
        console.error("사용자 정보 또는 목표 정보 없음:", { user, targets });
        throw new Error("필요한 정보를 가져오지 못했습니다.");
      }

      // 새로운 통합 서비스 사용 (체중 분석 데이터 포함)
      const mealPlan = await generateMealPlan(user, targets, dietStyle, weightAnalysis);
      setCards(mealPlan);

    } catch (e) {
      setErr(e.message || "로딩 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchAll(); 
  }, [user, dietStyle, weightAnalysis]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>추천식단</h2>
        <button
          onClick={fetchAll}
          disabled={loading}
          className={styles.refreshBtn}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
        {loading ? "불러오는 중…" : "다시 추천"}
        </button>
      </div>

      {!targets && user && (
        <div className={styles.alert}>
          <h4>목표 설정이 필요합니다</h4>
          <p>식단 추천을 위해 다음 중 하나가 필요합니다:</p>
          <div style={{ margin: '10px 0' }}>
            <strong>옵션 1:</strong> 목표 칼로리 설정 (권장)
          </div>
          <div style={{ margin: '10px 0' }}>
            <strong>옵션 2:</strong> 프로필 정보 입력
            <ul style={{ textAlign: 'left', margin: '5px 0' }}>
              {(!user.sex && !user.gender) && <li>성별</li>}
              {(!user.startWeight && !user.weight) && <li>체중</li>}
              {(!user.heightCm && !user.height) && <li>신장</li>}
              {!user.age && <li>나이</li>}
              {(!user.activityKey && !user.activity) && <li>활동량 레벨</li>}
            </ul>
          </div>
          <p>목표 설정 또는 프로필 설정에서 정보를 완성해 주세요.</p>
        </div>
      )}

      {!user && (
        <div className={styles.alert}>
          로그인이 필요합니다.
        </div>
      )}

      {targets && (
        <div className={styles.targets}>
          <div><strong>일일 목표</strong></div>
          <div className={styles.targetsMeta}>
            <div>칼로리: <b>{targets.tdee.toLocaleString()}</b> kcal</div>
            <div className={styles.subtitle}>
              탄수화물: <b>{targets.carbG}</b> g · 단백질: <b>{targets.proteinG}</b> g · 지방: <b>{targets.fatG}</b> g
            </div>
            <div className={styles.subtitle}>
              식단 스타일: <b>{getDietStyleLabel(dietStyle)}</b>
            </div>

            {/* 툴팁 적용 */}
            <div className={styles.subtitle}>
              <span
                className={styles.tooltip}
                data-tip="BMR(기초대사량): 가만히 있어도 생명 유지에 필요한 에너지"
              >
                BMR: {targets.bmr} kcal
                <span className={styles.infoDot}>i</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {err && <div className={styles.alert}>{err}</div>}
      {loading && (
        <Skeleton count={3} />
      )}

      {!loading && !err && targets && (
        <div className={styles.grid}>
          <MealCard {...cards.breakfast} />
          <MealCard {...cards.lunch} />
          <MealCard {...cards.dinner} />
        </div>
      )}
    </div>
  );
}

export default ChatDietRecommender;
