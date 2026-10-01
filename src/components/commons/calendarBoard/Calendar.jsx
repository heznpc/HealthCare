// src/comp/CalendarBoard/CalendarWrapper.jsx
import React, { useState } from 'react';
import DietCategoryCalendar from './DietCategoryCalendar';
import ExerciseCategoryCalendar from './ExerciseCategoryCalendar'; // ✅ 운동 캘린더 추가
// import WeightCalendar from './WeightCalendar';

import '../../css/Calendar/Calendar.css';

const TABS = [
  { key: 'diet', label: '식단' },
  { key: 'workout', label: '운동' },
  { key: 'weight', label: '체중' },
];

function Calendar() {
  const [activeTab, setActiveTab] = useState('diet');

  return (
    <div className="calendar-wrapper-container">
      <h2 className="calendar-wrapper-title">📅 건a강 관리 캘린더</h2>

      <div className="calendar-wrapper-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`calendar-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="calendar-wrapper-content">
        {activeTab === 'diet' && <DietCategoryCalendar />}
        {activeTab === 'workout' && <ExerciseCategoryCalendar />} {/* ✅ 운동 탭 렌더링 */}
        {/* {activeTab === 'weight' && <WeightCalendar />} */}
      </div>
    </div>
  );
}

export default Calendar;
