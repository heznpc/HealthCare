import React, { useState } from "react";
import DietCategoryCalendar from "./DietCategoryCalendar";
import ExerciseCategoryCalendar from "./ExerciseCategoryCalendar";
// import WeightCalendar from "./WeightCalendar";

import styles from "./css/CalendarWrapper.module.css"; // ← 모듈 CSS
import WeightCalendar from "./WeightCalendar";

const TABS = [
  { key: "diet", label: "식단" },
  { key: "workout", label: "운동" },
  { key: "weight", label: "체중" },
];

export default function CalendarWrapper() {
  const [activeTab, setActiveTab] = useState("diet");

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>📅 건강 관리 캘린더</h2>

      <div className={styles.tabs} role="tablist" aria-label="캘린더 종류">
        {TABS.map((tab) => {
          const selected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`${styles.tabBtn} ${selected ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className={styles.content}>
        {activeTab === "diet" && <DietCategoryCalendar />}
        {activeTab === "workout" && <ExerciseCategoryCalendar />}
        {activeTab === "weight" && <WeightCalendar />}
      </div>
    </div>
  );
}
