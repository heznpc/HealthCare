import React, { useEffect, useState, useRef } from 'react';
import Calendar from 'react-calendar';
import { useNavigate } from 'react-router-dom';
import { fmtLocal, getUserKey } from './../../../utils/calendarUtils';
import { storage } from '../../../utils/storage';

const DBLCLICK_MS = 450;

const TYPE_CONFIG = {
  diet: {
    title: '🥗 식단 캘린더',
    recordPath: '/diet-record',
    storageKey: 'dietRecords',
    categoryKey: 'mealType',
    colorKey: 'dietCategoryColors',
  },
  workout: {
    title: '🏋️ 운동 캘린더',
    recordPath: '/exercise-record',
    storageKey: 'workoutRecords',
    categoryKey: 'workoutType',
    colorKey: 'workoutCategoryColors',
  },
  weight: {
    title: '⚖️ 체중 캘린더',
    recordPath: '/weight-record',
    storageKey: 'weightRecords',
    categoryKey: 'weight',
    colorKey: null,
  },
};

function UnifiedHealthCalendar({ type }) {
  const config = TYPE_CONFIG[type];
  const [value, setValue] = useState(new Date());
  const [categoryMap, setCategoryMap] = useState({});
  const [colorMap, setColorMap] = useState({});
  const userKey = getUserKey();
  const navigate = useNavigate();
  const lastClickRef = useRef({ iso: '', ts: 0 });

  useEffect(() => {
    if (!userKey || !config) return;

    const all = storage.get(config.storageKey) || {};
    const rows = all[userKey] || [];

    const map = {};
    rows.forEach((r) => {
      const date = r.date;
      const cat = r[config.categoryKey];
      if (!date || !cat) return;
      (map[date] ||= new Set()).add(cat);
    });
    setCategoryMap(map);

    if (config.colorKey) {
      const saved = storage.get(config.colorKey) || {};
      setColorMap(saved);
    }
  }, [userKey, config]);

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const iso = fmtLocal(date);
    const cats = categoryMap[iso];
    if (!cats?.size) return null;

    return (
      <div className="calendar-dots">
        {[...cats].map((cat) => (
          <span
            key={cat}
            className="calendar-dot"
            style={{ background: colorMap[cat] || '#cbd5e1' }}
            title={cat}
          />
        ))}
      </div>
    );
  };

  const onClickDay = (dateObj) => {
    const iso = fmtLocal(dateObj);
    const now = Date.now();
    const { iso: lastIso, ts: lastTs } = lastClickRef.current;

    if (iso === lastIso && now - lastTs < DBLCLICK_MS) {
      navigate(`${config.recordPath}?date=${iso}`);
    }

    lastClickRef.current = { iso, ts: now };
  };

  return (
    <div className="unified-calendar-container">
      <h3 className="unified-calendar-title">{config.title}</h3>
      <Calendar
        onChange={setValue}
        value={value}
        tileContent={tileContent}
        onClickDay={onClickDay}
        locale="ko-KR"
        className="unified-calendar-component"
        prev2Label={null}
        next2Label={null}
        prevLabel="‹"
        nextLabel="›"
        navigationLabel={({ date }) =>
          `${date.getFullYear()}년 ${date.getMonth() + 1}월`
        }
      />
    </div>
  );
}

export default UnifiedHealthCalendar;
