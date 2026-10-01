import React, { useState } from 'react';
import UnifiedHealthCalendar from './UnifiedHealthCalendar';

const TABS = [
  { key: 'diet', label: '식단' },
  { key: 'workout', label: '운동' },
  { key: 'weight', label: '체중' },
];

function CalendarWrapper() {
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
        <UnifiedHealthCalendar type={activeTab} />
      </div>
    </div>
  );
}

export default CalendarWrapper;