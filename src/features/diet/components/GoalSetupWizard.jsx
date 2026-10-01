import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import { storage } from "../../../utils/storage";
import styles from "../css/GoalSetupWizard.module.css";

/** 활동 레벨 */
const ACTIVITY_LEVELS = [
  { key: "sedentary", label: "앉아서 지냄(거의 운동 안함)", factor: 1.2 },
  { key: "light", label: "가벼운 활동(주 1~3회)", factor: 1.375 },
  { key: "moderate", label: "보통 활동(주 3~5회)", factor: 1.55 },
  { key: "active", label: "활발(주 6~7회)", factor: 1.725 },
  { key: "very_active", label: "매우 활발(육체노동/2회운동)", factor: 1.9 },
];

/** 식단 스타일 */
const DIET_STYLES = [
  { key: "general", label: "일반" },
  { key: "training", label: "운동" },
  { key: "keto", label: "키토" },
  { key: "vegan", label: "비건" },
];

/** Auth + storage 기반 기본값 생성 */
function makeDefaultsFromAuth(authUser, defaultProfileProp) {
  const rec = authUser?.id ? storage.getUserById(authUser.id) : null;
  const p = rec?.profile || {};
  const src = defaultProfileProp || {};
  const gender = p.gender || src.gender || "male";
  const sex = gender === "female" ? "F" : "M";
  const num = (v, f) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : f;
  };
  return {
    userId: rec?.id || src.userId || "",
    username: p.username || authUser?.username || src.username || "",
    sex,
    age: num(p.age ?? src.age, 30),
    heightCm: num(p.heightCm ?? src.heightCm, 170),
    weight: num(p.weight ?? src.weight, 70),
    userKey: rec?.userKey || authUser?.userKey || src.userKey || "guest",
  };
}

export default function GoalSetupWizard({ open, onClose, onSave, defaultProfile }) {
  const { user } = useAuth();
  const base = useMemo(() => makeDefaultsFromAuth(user, defaultProfile), [user, defaultProfile]);

  const [step, setStep] = useState(1);
  const [activityKey, setActivityKey] = useState("moderate");

  // step2
  const [sex, setSex] = useState(base.sex);
  const [age, setAge] = useState(String(base.age));
  const [heightCm, setHeightCm] = useState(String(base.heightCm));
  const [startWeight, setStartWeight] = useState(String(base.weight));
  const [goalWeight, setGoalWeight] = useState(String(Math.max(10, base.weight - 6)));

  // step3
  const [pace, setPace] = useState(0.5);

  // step4
  const [dietStyle, setDietStyle] = useState("general");

  const DIET_STYLE_DESCRIPTIONS = {
    general: "균형 잡힌 탄수화물, 단백질, 지방 구성 (일반 식사 스타일)",
    training: "단백질 비중을 높여 근육 성장 및 회복에 집중",
    keto: "탄수화물을 제한하고 건강한 지방 섭취를 중심으로 한 식단",
    vegan: "동물성 식품을 배제하고 식물성 위주로 섭취하는 식단",
  };

  useEffect(() => {
    setSex(base.sex);
    setAge(String(base.age));
    setHeightCm(String(base.heightCm));
    setStartWeight(String(base.weight));
    setGoalWeight(String(Math.max(10, base.weight - 6)));
  }, [base.sex, base.age, base.heightCm, base.weight]);

  const asNum = (v) => {
    const n = typeof v === "number" ? v : parseFloat(v);
    return Number.isFinite(n) ? n : NaN;
  };

  const activityFactor = useMemo(
    () => ACTIVITY_LEVELS.find((a) => a.key === activityKey)?.factor ?? 1.55,
    [activityKey]
  );

  const bmr = useMemo(() => {
    const w = asNum(startWeight);
    const h = asNum(heightCm);
    const a = asNum(age);
    if (!Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(a)) return 0;
    return sex === "M"
      ? Math.round(10 * w + 6.25 * h - 5 * a + 5)
      : Math.round(10 * w + 6.25 * h - 5 * a - 161);
  }, [sex, age, heightCm, startWeight]);

  const tdee = useMemo(() => Math.round(bmr * activityFactor), [bmr, activityFactor]);

  const startWNum = asNum(startWeight);
  const goalWNum = asNum(goalWeight);
  const isBulking =
    Number.isFinite(startWNum) && Number.isFinite(goalWNum) ? goalWNum > startWNum : false;

  const dailyKcalShift = useMemo(() => Math.round((pace * 7700) / 7), [pace]);

  const targetCalories = useMemo(
    () => (tdee ? (isBulking ? tdee + dailyKcalShift : tdee - dailyKcalShift) : 0),
    [tdee, isBulking, dailyKcalShift]
  );

  const weeksNeeded = useMemo(() => {
    const s = startWNum,
      g = goalWNum;
    const diff = Number.isFinite(s) && Number.isFinite(g) ? Math.abs(g - s) : 0;
    return Math.max(1, Math.ceil(diff / Math.max(0.1, pace)));
  }, [startWNum, goalWNum, pace]);

  if (!open) return null;

  const canNextFrom1 = !!activityKey;
  const canNextFrom2 =
    Number.isFinite(startWNum) &&
    Number.isFinite(goalWNum) &&
    Number.isFinite(asNum(heightCm)) &&
    Number.isFinite(asNum(age)) &&
    startWNum > 0 &&
    goalWNum > 0 &&
    asNum(heightCm) > 0 &&
    asNum(age) > 0 &&
    (sex === "M" || sex === "F");
  const canNextFrom3 = pace >= 0.1 && pace <= 1.5;
  const canSave = !!dietStyle && targetCalories > 0;

  const handleSave = () => {
    const payload = {
      id: `goal_${Date.now()}`,
      userKey: base.userKey,
      userId: base.userId,
      username: base.username,
      activityKey,
      activityFactor,
      sex,
      age: asNum(age),
      heightCm: asNum(heightCm),
      startWeight: startWNum,
      goalWeight: goalWNum,
      paceKgPerWeek: pace,
      bmr,
      tdee,
      targetCalories,
      weeksNeeded,
      dietStyle,
      createdAt: new Date().toISOString(),
    };

    try {
      const uKey = base.userKey || base.userId || "guest";
      const bucketRaw = storage.get("userGoals") ?? storage.get("userGoal") ?? {};
      const bucket =
        bucketRaw && typeof bucketRaw === "object" && !Array.isArray(bucketRaw) ? bucketRaw : {};
      const prevArr = Array.isArray(bucket[uKey]) ? bucket[uKey] : [];
      const existing = prevArr[0] || null;

      const nextOne = existing
        ? {
            ...existing,
            ...payload,
            id: existing.id,
            createdAt: existing.createdAt || payload.createdAt,
            updatedAt: new Date().toISOString(),
          }
        : payload;

      const next = { ...bucket, [uKey]: [nextOne] };
      storage.set("userGoal", next);
      storage.set("userGoals", next);
      storage.set("goalCongrats", { show: true, at: payload.createdAt });
      storage.set("welcomeModalDismissed", { dismissed: true, at: payload.createdAt });
    } catch {}

    onSave?.(payload);
    onClose?.();
  };

  return (
    <div
      className={styles.gswOverlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={styles.gswModal} role="dialog" aria-modal="true" aria-label="목표 설정">
        <header className={styles.gswHeader}>
          <h3 className={styles.gswH3}>🎯 목표 설정</h3>
          <button className={styles.gswIcon} onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>

        <div className={styles.gswBody}>
          {/* Steps */}
          <div className={styles.gswSteps}>
            <span className={`${styles.gswStep} ${step === 1 ? styles.gswStepActive : ""}`}>1 활동량</span>
            <span className={`${styles.gswStep} ${step === 2 ? styles.gswStepActive : ""}`}>2 신체/체중</span>
            <span className={`${styles.gswStep} ${step === 3 ? styles.gswStepActive : ""}`}>3 속도/칼로리</span>
            <span className={`${styles.gswStep} ${step === 4 ? styles.gswStepActive : ""}`}>4 식단 스타일</span>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <section>
              <h4 className={styles.gswH4}>평소 활동량</h4>
              <ul className={styles.gswList}>
                {ACTIVITY_LEVELS.map((a) => (
                  <li key={a.key}>
                    <label className={styles.gswRow}>
                      <input
                        type="radio"
                        name="activity"
                        value={a.key}
                        checked={activityKey === a.key}
                        onChange={() => setActivityKey(a.key)}
                      />
                      <span>{a.label}</span>
                      <code className={styles.gswCode}>× {a.factor}</code>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <section className={styles.gswGrid2}>
              <div>
                <h4 className={styles.gswH4}>기본 정보</h4>

                <label className={styles.gswLabel}>성별</label>
                <select value={sex} onChange={(e) => setSex(e.target.value)} className={styles.gswInput}>
                  <option value="M">남</option>
                  <option value="F">여</option>
                </select>

                <label className={styles.gswLabel}>나이</label>
                <input
                  type="number"
                  min={10}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={styles.gswInput}
                />

                <label className={styles.gswLabel}>키(cm)</label>
                <input
                  type="number"
                  min={80}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className={styles.gswInput}
                />

                {base.username && (
                  <div className={styles.gswUserMeta}>
                    사용자: <strong>{base.username}</strong>
                    {base.userId ? ` / ID: ${base.userId}` : ""}
                  </div>
                )}
              </div>

              <div>
                <h4 className={styles.gswH4}>체중</h4>
                <label className={styles.gswLabel}>시작 체중(kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={startWeight}
                  onChange={(e) => setStartWeight(e.target.value)}
                  className={styles.gswInput}
                />

                <label className={styles.gswLabel}>목표 체중(kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                  className={styles.gswInput}
                />

                <div className={styles.gswCalcBox}>
                  <div>
                    BMR: <strong>{bmr ? bmr.toLocaleString() : "-"}</strong> kcal
                  </div>
                  <div>
                    TDEE: <strong>{tdee ? tdee.toLocaleString() : "-"}</strong> kcal
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <section>
              <h4 className={styles.gswH4}>{isBulking ? "증량 속도" : "감량 속도"} (kg/주)</h4>

              <input
                className={styles.gswRange}
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={pace}
                onChange={(e) => setPace(+e.target.value)}
              />

              <div className={`${styles.gswRow} ${styles.gswSpaceBetween}`}>
                <span>느리게(0.1)</span>
                <strong>{pace.toFixed(2)} kg/주</strong>
                <span>빠르게(1.5)</span>
              </div>

              <div className={styles.gswCalcGrid}>
                <div className={styles.gswItem}>
                  <span>일일 칼로리 {isBulking ? "추가" : "감소"}</span>
                  <strong>{dailyKcalShift.toLocaleString()} kcal</strong>
                </div>
                <div className={styles.gswItem}>
                  <span>목표 섭취 칼로리</span>
                  <strong>{targetCalories ? targetCalories.toLocaleString() : "-"} kcal/일</strong>
                </div>
                <div className={styles.gswItem}>
                  <span>예상 소요 기간</span>
                  <strong>{weeksNeeded} 주</strong>
                </div>
              </div>

              {targetCalories > 0 && (
                <p className={styles.gswTip}>참고: 과도한 감량은 권장되지 않습니다(0.25~1.0 kg/주 권장).</p>
              )}
            </section>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <section>
              <h4 className={styles.gswH4}>식단 스타일</h4>

              <div className={styles.gswPillGroup}>
                {DIET_STYLES.map((d) => {
                  const selected = dietStyle === d.key;
                  return (
                    <button
                      key={d.key}
                      type="button"
                      aria-pressed={selected}
                      className={`${styles.gswPill} ${selected ? styles.gswPillActive : ""}`}
                      onClick={() => setDietStyle(d.key)}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>

              <p className={styles.gswDesc}>{DIET_STYLE_DESCRIPTIONS[dietStyle]}</p>

              <div className={styles.gswSummary}>
                <h5 className={styles.gswH5}>요약</h5>
                <ul className={styles.gswList}>
                  <li>
                    활동량:{" "}
                    <strong>{ACTIVITY_LEVELS.find((a) => a.key === activityKey)?.label}</strong>{" "}
                    (×{activityFactor})
                  </li>
                  <li>
                    BMR/TDEE: <strong>{bmr ? bmr.toLocaleString() : "-"}</strong> /{" "}
                    <strong>{tdee ? tdee.toLocaleString() : "-"}</strong> kcal
                  </li>
                  <li>
                    목표칼로리: <strong>{targetCalories ? targetCalories.toLocaleString() : "-"}</strong>{" "}
                    kcal/일
                  </li>
                  <li>기간: <strong>{weeksNeeded} 주</strong></li>
                  <li>
                    스타일: <strong>{DIET_STYLES.find((d) => d.key === dietStyle)?.label}</strong>
                  </li>
                </ul>
              </div>
            </section>
          )}
        </div>

        <footer className={styles.gswFooter}>
          {step > 1 ? (
            <button className={styles.gswGhost} onClick={() => setStep(step - 1)}>
              이전
            </button>
          ) : (
            <span />
          )}

          {step < 4 && (
            <button
              className={styles.gswPrimary}
              onClick={() => {
                if (
                  (step === 1 && canNextFrom1) ||
                  (step === 2 && canNextFrom2) ||
                  (step === 3 && canNextFrom3)
                ) {
                  setStep(step + 1);
                }
              }}
              disabled={
                (step === 1 && !canNextFrom1) ||
                (step === 2 && !canNextFrom2) ||
                (step === 3 && !canNextFrom3)
              }
            >
              다음
            </button>
          )}

          {step === 4 && (
            <button className={styles.gswPrimary} onClick={handleSave} disabled={!canSave}>
              목표 저장
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
