import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fmtLocal, getUserKey } from './calendarUtils';
import { storage } from '../utils/storage';

function RecordForm() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const dateParam = searchParams.get('date');
  const userKey = getUserKey();
  const [date, setDate] = useState(dateParam || fmtLocal(new Date()));
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({});
  const storageKey = `${userKey}_${type}Records`;

  useEffect(() => {
    const all = storage.get(storageKey) || [];
    const filtered = all.filter((r) => r.date === date);
    setRecords(filtered);
  }, [date, storageKey]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    const newRecord = {
      id: Date.now(),
      date,
      ...form,
    };
    const all = storage.get(storageKey) || [];
    const updated = [...all, newRecord];
    storage.set(storageKey, updated);
    setRecords(updated.filter((r) => r.date === date));
    setForm({});
  };

  const handleDelete = (id) => {
    const all = storage.get(storageKey) || [];
    const updated = all.filter((r) => r.id !== id);
    storage.set(storageKey, updated);
    setRecords(updated.filter((r) => r.date === date));
  };

  const renderFormFields = () => {
    switch (type) {
      case 'diet':
        return (
          <>
            <input name="mealType" placeholder="식사 종류" value={form.mealType || ''} onChange={handleChange} />
            <input name="name" placeholder="음식 이름" value={form.name || ''} onChange={handleChange} />
            <input name="quantity" type="number" placeholder="수량" value={form.quantity || ''} onChange={handleChange} />
            <input name="energy" type="number" placeholder="칼로리" value={form.energy || ''} onChange={handleChange} />
            <input name="protein" type="number" placeholder="단백질" value={form.protein || ''} onChange={handleChange} />
            <input name="fat" type="number" placeholder="지방" value={form.fat || ''} onChange={handleChange} />
            <input name="carb" type="number" placeholder="탄수화물" value={form.carb || ''} onChange={handleChange} />
          </>
        );
      case 'workout':
        return (
          <>
            <input name="workoutType" placeholder="운동 종류" value={form.workoutType || ''} onChange={handleChange} />
            <input name="duration" type="number" placeholder="운동 시간 (분)" value={form.duration || ''} onChange={handleChange} />
            <select name="intensity" value={form.intensity || ''} onChange={handleChange}>
              <option value="">강도 선택</option>
              <option value="low">낮음</option>
              <option value="medium">보통</option>
              <option value="high">높음</option>
            </select>
          </>
        );
      case 'weight':
        return (
          <>
            <input name="weight" type="number" placeholder="몸무게 (kg)" value={form.weight || ''} onChange={handleChange} />
          </>
        );
      default:
        return <p>잘못된 기록 유형입니다.</p>;
    }
  };

  return (
    <div>
      <h2>📋 {type} 기록 ({date})</h2>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      {renderFormFields()}
      <button onClick={handleAdd}>기록 추가</button>

      <ul>
        {records.map((r) => (
          <li key={r.id}>
            {JSON.stringify(r)}
            <button onClick={() => handleDelete(r.id)}>삭제</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RecordForm;
