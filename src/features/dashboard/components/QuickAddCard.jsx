// src/features/dashboard/components/QuickAddCard.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./css/QuickAddCard.module.css";
import FoodAddModal from "../../diet/components/FoodAddModal"; // ✅ 식단 모달 import

export default function QuickAddCard({ onAddExercise, onAddWeight }) {
  const nav = useNavigate();
  const [openDietModal, setOpenDietModal] = useState(false);

  // 식단 추가 버튼 → 모달 바로 열기
  const goDiet = () => setOpenDietModal(true);

  const goExercise = () =>
    onAddExercise ? onAddExercise() : nav("/exercise/exercise-record");

  const goWeight = () =>
    onAddWeight ? onAddWeight() : (window.location.href = "/weight/weight-record");

  // 식단 모달에서 "확인" 눌렀을 때
  const handleConfirmDiet = (foodData) => {
    // 여기서 저장 로직 실행하거나 상위로 전달 가능
    console.log("새로운 음식 추가:", foodData);
    setOpenDietModal(false);
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>⚡ 빠른 추가</h3>
      <div className={styles.grid}>
        <button type="button" className={styles.pill} onClick={goDiet}>
          식단 추가
        </button>
        <button type="button" className={styles.pill} onClick={goExercise}>
          운동 추가
        </button>
        <button type="button" className={styles.pill} onClick={goWeight}>
          체중 기록
        </button>
      </div>

      {/* ✅ 식단 추가 모달 */}
      <FoodAddModal
        open={openDietModal}
        onClose={() => setOpenDietModal(false)}
        onConfirm={handleConfirmDiet}
        baseDate={new Date()} // 오늘 날짜 기본 전달
      />
    </div>
  );
}
