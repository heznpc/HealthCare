import { showAlert } from '../../../utils/dialogs';
// src/comp/Dietmanagement/FoodAddModal.jsx
import { useEffect, useRef, useState } from "react";
import { fetchFoodList } from "../services/FoodApi";
import "../css/FoodAddModal.css";

const PRESET_FOODS = [
  { name: "백미밥", energy: "300.000", protein: "6.00", fat: "0.50", carb: "67.00", quantity: 1 },
  { name: "현미밥", energy: "330.000", protein: "7.00", fat: "2.20", carb: "70.00", quantity: 1 },
  { name: "잡곡밥", energy: "320.000", protein: "7.50", fat: "2.00", carb: "66.00", quantity: 1 },
  { name: "닭가슴살", energy: "165.000", protein: "31.00", fat: "3.60", carb: "0.00", quantity: 1 },
  { name: "달걀(계란)", energy: "70.000", protein: "6.00", fat: "5.00", carb: "0.60", quantity: 1 },
  { name: "바나나", energy: "105.000", protein: "1.30", fat: "0.30", carb: "27.00", quantity: 1 },
  { name: "사과", energy: "95.000", protein: "0.50", fat: "0.30", carb: "25.00", quantity: 1 },
  { name: "고구마", energy: "110.000", protein: "1.60", fat: "0.10", carb: "26.00", quantity: 1 },
  { name: "두부", energy: "80.000", protein: "8.00", fat: "4.00", carb: "2.00", quantity: 1 },
  { name: "우유", energy: "130.000", protein: "8.00", fat: "7.00", carb: "10.00", quantity: 1 },
  { name: "요거트", energy: "150.000", protein: "5.00", fat: "4.00", carb: "20.00", quantity: 1 },
  { name: "식빵", energy: "160.000", protein: "5.00", fat: "2.50", carb: "30.00", quantity: 2 },
  { name: "현미떡", energy: "220.000", protein: "4.00", fat: "1.00", carb: "48.00", quantity: 1 },
  { name: "김치", energy: "15.000", protein: "1.10", fat: "0.20", carb: "3.00", quantity: 1 },
  { name: "샐러드(야채)", energy: "60.000", protein: "2.00", fat: "3.00", carb: "7.00", quantity: 1 },
];

// ✅ 한국시간 로컬 datetime 문자열 생성 함수
function getLocalDateTimeStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

// 선택 날짜 + 현재 시각을 합쳐서 datetime-local 기본값 생성
function composeDateTime(baseDateStr) {
  if (!baseDateStr) return getLocalDateTimeStr();
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${baseDateStr}T${hh}:${mm}`;
}

function FoodAddModal({ open, onClose, onConfirm,baseDate  }) {
  const dropdownAreaRef = useRef(null);
  const wrapRef = useRef(null);

  const [query, setQuery] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [foodList, setFoodList] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);

  // 수동추가 상태
  const [manualMode, setManualMode] = useState(false);
  const [mName, setMName] = useState("");
  const [mCal, setMCal] = useState("");
  const [mP, setMP] = useState("");
  const [mC, setMC] = useState("");
  const [mF, setMF] = useState("");

  // ✅ 기본값을 “선택한 날짜 + 현재시각”으로
  const [dateTime, setDateTime] = useState(() => composeDateTime(baseDate));

    // 열릴 때마다 선택 날짜 반영
  useEffect(() => {
    if (!open) return;
    setDateTime(composeDateTime(baseDate));
  }, [open, baseDate]);

  useEffect(() => {
    if (!open) return;
    resetAll();
    const hide = (e) => {
      if (dropdownAreaRef.current && !dropdownAreaRef.current.contains(e.target)) setFoodList([]);
    };
    document.addEventListener("mousedown", hide);
    document.addEventListener("touchstart", hide);
    return () => {
      document.removeEventListener("mousedown", hide);
      document.removeEventListener("touchstart", hide);
    };
  }, [open]);

  useEffect(() => {
    const onDown = (e) => {
      if (!open) return;
      if (wrapRef.current && !wrapRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onClose]);

  // 디바운스 검색
  useEffect(() => {
    if (!open || manualMode) return;
    if (query.trim().length < 1) {
      setFoodList([]);
      return;
    }
    const t = setTimeout(async () => {
      const list = await fetchFoodList(query.trim());
      setFoodList(list || []);
    }, 250);
    return () => clearTimeout(t);
  }, [query, open, manualMode]);

 const resetAll = (dt = composeDateTime(baseDate)) => {
    setQuery("");
    setQuantity(1);
    setFoodList([]);
    setSelectedFood(null);
    setManualMode(false);
    setMName("");
    setMCal("");
    setMP("");
    setMC("");
    setMF("");
    setDateTime(dt);  // ✅ 전달받은 날짜/시각으로 리셋
  };

  const manualSearch = async () => {
    if (query.trim().length < 1) {
      setFoodList([]);
      return;
    }
    const list = await fetchFoodList(query.trim());
    setFoodList(list || []);
  };

  const confirm = () => {
    if (quantity < 1) return showAlert("수량은 1 이상이어야 합니다.");

    let newFood = null;

    if (manualMode) {
      const name = mName.trim();
      if (!name) return showAlert("이름을 입력하세요.");

      const p = mP === "" ? 0 : Number(mP);
      const c = mC === "" ? 0 : Number(mC);
      const f = mF === "" ? 0 : Number(mF);

      if (![p, c, f].every((n) => Number.isFinite(n) && n >= 0)) {
        return showAlert("단백질/탄수화물/지방은 0 이상의 숫자여야 합니다.");
      }

      const kcalProvided = mCal !== "" && Number.isFinite(Number(mCal)) && Number(mCal) >= 0;
      if (mCal !== "" && !kcalProvided) return showAlert("칼로리를 올바른 숫자로 입력하세요.");

      const energy = kcalProvided ? Number(mCal) : p * 4 + c * 4 + f * 9;

      newFood = {
        name,
        energy: energy.toFixed(3),
        protein: p.toFixed(2),
        fat: f.toFixed(2),
        carb: c.toFixed(2),
      };
    } else {
      if (!selectedFood) return showAlert("음식을 선택하세요.");
      newFood = selectedFood;
    }

    // datetime-local → date + time 분리 (한국시간 그대로 사용)
    const dt = new Date(dateTime);
    const date = getLocalDateTimeStr(dt).split("T")[0]; // YYYY-MM-DD
    const time = `${String(dt.getHours()).padStart(2, "0")}:${String(
      dt.getMinutes()
    ).padStart(2, "0")}:${String(dt.getSeconds()).padStart(2, "0")}`;

    onConfirm?.({ selectedFood: newFood, quantity, date, time });
  };

  if (!open) return null;

  return (
    <div className="foodadd-modal modal-backdrop">
      <div className="modal-panel" ref={wrapRef}>
        <h3>🍙 음식 추가</h3>

        {/* 모드 토글 */}
        <div className="modal-row" style={{ gap: 8, marginBottom: 10 }}>
          <button
            className={`fam-btn ${!manualMode ? "fam-btn-primary" : "ghost"}`}
            onClick={() => setManualMode(false)}
          >
            검색추가
          </button>
          <button
            className={`fam-btn ${manualMode ? "fam-btn-primary" : "ghost"}`}
            onClick={() => {
              setManualMode(true);
              setSelectedFood(null);
              setFoodList([]);
            }}
          >
            수동추가
          </button>
        </div>

        {/* 날짜+시간 입력 → datetime-local */}
        <div className="modal-row" style={{ marginBottom: 10, gap: 8 }}>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="datetime-input"
          />
        </div>


        {/* 검색 모드 */}
        {!manualMode && (
          <div className="modal-row" style={{ position: "relative" }} ref={dropdownAreaRef}>
            <input
              type="text"
              placeholder="음식명 검색"
              value={selectedFood ? selectedFood.name : query}
              onChange={(e) => {
                setSelectedFood(null);
                setQuery(e.target.value);
              }}
              onKeyDown={(e) => e.key === "Enter" && manualSearch()}
              className="search-input"
              autoFocus
            />
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="quantity-input"
            />
            <button className="fam-btn fam-btn-primary" onClick={manualSearch}>
              검색
            </button>
            <button className="fam-btn fam-btn-primary" onClick={confirm}>
              추가
            </button>

            {foodList.length > 0 && (
              <div className="search-results-dropdown">
                {foodList.map((f, i) => (
                  <div
                    key={`sr-${i}`}
                    className="search-result-item"
                    onClick={() => {
                      setSelectedFood(f);
                      setFoodList([]);
                      setQuantity(1);
                    }}
                  >
                    <span className="food-name">{f.name}</span>
                    <span>{(+f.energy).toFixed(2)} kcal</span>
                    <span>P {(+f.protein).toFixed(2)} g</span>
                    <span>F {(+f.fat).toFixed(2)} g</span>
                    <span>C {(+f.carb).toFixed(2)} g</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 수동추가 모드 */}
        {manualMode && (
          <div className="modal-row manual-wrap">
            <input
              type="text"
              placeholder="이름"
              value={mName}
              onChange={(e) => setMName(e.target.value)}
              className="search-input"
            />
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="칼로리(kcal)"
              value={mCal}
              onChange={(e) => setMCal(e.target.value)}
              className="quantity-input"
            />
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="단백질(g)"
              value={mP}
              onChange={(e) => setMP(e.target.value)}
              className="quantity-input"
            />
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="탄수화물(g)"
              value={mC}
              onChange={(e) => setMC(e.target.value)}
              className="quantity-input"
            />
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="지방(g)"
              value={mF}
              onChange={(e) => setMF(e.target.value)}
              className="quantity-input"
            />
            <input
              type="number"
              min="1"
              placeholder="수량"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="quantity-input"
            />
            <div className="manual-actions">
              <button
                className="fam-btn"
                onClick={() => {
                  setMName("");
                  setMCal("");
                  setMP("");
                  setMC("");
                  setMF("");
                  setQuantity(1);
                }}
              >
                초기화
              </button>
              <button className="fam-btn fam-btn-primary" onClick={confirm}>
                추가
              </button>
            </div>
          </div>
        )}

        {/* 프리셋 */}
        {!manualMode && (
          <div className="preset-grid">
            {PRESET_FOODS.map((f) => (
              <div
                key={f.name}
                role="button"
                tabIndex={0}
                className={`preset-card ${selectedFood?.name === f.name ? "active" : ""}`}
                onClick={() => {
                  setSelectedFood(f);
                  setQuantity(f.quantity ?? 1);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedFood(f);
                    setQuantity(f.quantity ?? 1);
                  }
                }}
                title={`${f.name} • x${f.quantity ?? 1}`}
              >
                <div className="title-row">
                  <span className="title">{f.name}</span>
                  <span className="serving">x{f.quantity ?? 1}</span>
                </div>
                <div className="kcal-row">
                  {(+f.energy).toFixed(0)} kcal × x{f.quantity ?? 1}
                </div>
                <div className="macro-row">
                  <span>P {(+f.protein).toFixed(1)}g</span>
                  <span>F {(+f.fat).toFixed(1)}g</span>
                  <span>C {(+f.carb).toFixed(1)}g</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default FoodAddModal;
