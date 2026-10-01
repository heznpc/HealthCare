import { showAlert, showGuestLimit, showPrompt } from '../../../utils/dialogs';
import { guestPolicy } from '../../../utils/guestStorage';
import GuestNotice from '../../../components/commons/GuestNotice';
// src/features/diet/components/DietRecord.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PieChartSection from "./PieChart";
import FoodAddModal from "./FoodAddModal";
import { storage } from "../../../utils/storage";
import styles from "../css/DietRecord.module.css";

function fmtLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function loadUserFoods(userKey) {
  const all = storage.get("dietRecords") || {};
  if (userKey === "guest") {
    if (Array.isArray(all)) return all;
    return all.guest || [];
  }
  if (Array.isArray(all)) return [];
  return all[userKey] || [];
}

function saveUserFoods(userKey, nextFoods) {
  const all = storage.get("dietRecords") || {};
  if (userKey === "guest") {
    if (Array.isArray(all)) {
      storage.set("dietRecords", nextFoods);
    } else {
      all.guest = nextFoods;
      storage.set("dietRecords", all);
    }
    return;
  }
  if (Array.isArray(all)) {
    const obj = { guest: Array.isArray(all) ? all : [] };
    obj[userKey] = nextFoods;
    storage.set("dietRecords", obj);
  } else {
    all[userKey] = nextFoods;
    storage.set("dietRecords", all);
  }
}

export default function DietRecord() {
  const [userKey, setUserKey] = useState("guest");
  const today = fmtLocal(new Date());
  const [date, setDate] = useState(today);
  const [searchParams] = useSearchParams();

  const DEFAULT_TABS = ["전체", "아침", "점심", "저녁", "간식"];
  const [mealTabs, setMealTabs] = useState(DEFAULT_TABS);
  const [activeTab, setActiveTab] = useState("전체");

  const [selectedFoods, setSelectedFoods] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const q = searchParams.get("date");
    if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) setDate(q);
  }, [searchParams]);

  useEffect(() => {
    const userRaw = storage.get("currentAuth");
    const parsedKey =
      userRaw?.userKey || userRaw?.username || userRaw?.id || "guest";
    setUserKey(parsedKey);

    if (parsedKey !== "guest" && userRaw) {
      const allData = storage.get("dietRecords") || {};
      const rawUser = userRaw.username || userRaw.id;
      if (!Array.isArray(allData) && allData[rawUser] && rawUser !== parsedKey) {
        const merged = [...(allData[parsedKey] || []), ...allData[rawUser]];
        allData[parsedKey] = merged;
        delete allData[rawUser];
        storage.set("dietRecords", allData);
      }
    }

    setSelectedFoods(loadUserFoods(parsedKey));

    const savedTabs = storage.get(`dietMealTabs::${parsedKey}`);
    if (savedTabs) {
      const merged = Array.from(
        new Set(["전체", ...savedTabs.filter((t) => t && t !== "전체")])
      );
      setMealTabs(merged);
    } else {
      setMealTabs(DEFAULT_TABS);
    }

  }, []);

  const foodsForSelectedDate = selectedFoods.filter((f) => f.date === date);
  const foodsForView = foodsForSelectedDate.filter((f) =>
    activeTab === "전체" ? true : f.mealType === activeTab
  );

  const totalNutrition = foodsForView.reduce(
    (acc, food) => {
      const q = food.quantity || 1;
      acc.cal += (Number(food.energy) || 0) * q;
      acc.protein += (Number(food.protein) || 0) * q;
      acc.fat += (Number(food.fat) || 0) * q;
      acc.carb += (Number(food.carb) || 0) * q;
      return acc;
    },
    { cal: 0, protein: 0, fat: 0, carb: 0 }
  );

  const addFoodConfirmed = ({ selectedFood, quantity, date, time }) => {
    const firstRealTab = mealTabs.find((t) => t !== "전체") || "아침";
    const mealType = activeTab !== "전체" ? activeTab : firstRealTab;

    const foodWithMeta = {
      id: Date.now(),
      ...selectedFood,
      date: fmtLocal(new Date(date)),
      time,
      quantity,
      mealType,
    };

    if (userKey === "guest") {
      const current = loadUserFoods("guest");
      const updated = [...current, foodWithMeta];
      if (!guestPolicy.save(userKey, () => saveUserFoods("guest", updated))) {
        showGuestLimit();
        setOpenModal(false);
        return;
      }
      setSelectedFoods(updated);
      setOpenModal(false);
      return;
    }

    const current = loadUserFoods(userKey);
    const updated = [...current, foodWithMeta];
    saveUserFoods(userKey, updated);
    setSelectedFoods(updated);
    setOpenModal(false);
  };

  const handleDeleteFood = (id) => {
    const updated = selectedFoods.filter((f) => f.id !== id);
    saveUserFoods(userKey, updated);
    setSelectedFoods(updated);
  };

  const handleAddCategory = async () => {
    const name = await showPrompt("추가할 식사 카테고리 이름을 입력하세요 (예: 야식, 운동후 등)");
    const raw = (name || "").trim();
    if (!raw) return;
    if (raw.length > 12) return showAlert("카테고리명은 12자 이하로 입력해주세요.");
    if (raw === "전체") return showAlert("'전체'는 사용할 수 없습니다.");
    if (mealTabs.includes(raw)) return showAlert("이미 존재하는 카테고리입니다.");

    const nextTabs = [...mealTabs, raw];
    setMealTabs(nextTabs);
    setActiveTab(raw);
    storage.set(`dietMealTabs::${userKey}`, nextTabs.filter((t) => t !== "전체"));
  };

  return (
    <div className={styles.dietRecordContainer}>
      <div className={styles.dietLeftPanel}>
        <h2>🍽️ 식단 기록</h2>

        {userKey === "guest" && (
          <div className={styles.guestNotice}><GuestNotice /></div>
        )}

        <div className={styles.formSection}>
          <label>
            날짜:&nbsp;
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>

        <div className={styles.mealTabs}>
          {mealTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={tab === activeTab}
              className={`${styles.tab} ${tab === activeTab ? styles.active : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
          <button
            type="button"
            className={`${styles.tab} ${styles.add}`}
            onClick={handleAddCategory}
          >
            + 카테고리 추가
          </button>
        </div>

        <div>
          <button type="button" onClick={() => setOpenModal(true)}>음식 추가</button>
        </div>

        <div className={styles.recordedFoods}>
          <h3>📌 {date} — {activeTab} 보기</h3>
          {foodsForView.length === 0 ? (
            <p>기록된 식단이 없습니다.</p>
          ) : (
            <ul>
              {foodsForView.map((food) => (
                <li key={food.id}>
                  <strong>{food.mealType}</strong> - {food.name} ({food.quantity}개)
                  <br />
                  기록시각: {food.time}
                  <br />
                  칼로리: {(food.energy * food.quantity).toFixed(2)} kcal /
                  단백질: {(food.protein * food.quantity).toFixed(2)} g /
                  지방: {(food.fat * food.quantity).toFixed(2)} g /
                  탄수화물: {(food.carb * food.quantity).toFixed(2)} g
                  <button type="button" onClick={() => handleDeleteFood(food.id)} style={{ marginLeft: 10 }}>
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={styles.dietRightPanel}>
        <PieChartSection data={totalNutrition} />
      </div>

      <FoodAddModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onConfirm={addFoodConfirmed}
        baseDate={date}
      />
    </div>
  );
}
