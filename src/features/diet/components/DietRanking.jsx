import { localData } from "../../../utils/indexedStore.mjs";
// src/comp/DietRanking/DietRanking.jsx
import React, { useEffect, useState } from "react";
import "../css/DietRanking.css"; // 전용 CSS

export default function DietRanking() {
  const recordsKey = "dietRecords";
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    const stored = localData.getItem(recordsKey);
    if (!stored) {
      setRankings([]);
      return;
    }
    const allData = JSON.parse(stored); 
    const counter = {};

    Object.values(allData).forEach((foods) => {
      foods.forEach((f) => {
        if (!f.name) return;
        const qty = Number(f.quantity) || 1;
        if (!counter[f.name]) {
          counter[f.name] = {
            name: f.name,
            count: 0,
            totalCal: 0,
            totalProtein: 0,
            totalFat: 0,
            totalCarb: 0,
          };
        }
        counter[f.name].count += qty;
        counter[f.name].totalCal += (Number(f.energy) || 0) * qty;
        counter[f.name].totalProtein += (Number(f.protein) || 0) * qty;
        counter[f.name].totalFat += (Number(f.fat) || 0) * qty;
        counter[f.name].totalCarb += (Number(f.carb) || 0) * qty;
      });
    });

    const sorted = Object.values(counter).sort((a, b) => b.count - a.count);
    setRankings(sorted);
  }, []);

  return (
    <div className="diet-ranking-container">
      <h2 className="diet-ranking-title">🔥 인기 식단 랭킹</h2>
      {rankings.length === 0 ? (
        <p className="diet-ranking-empty">저장된 식단 데이터가 없습니다.</p>
      ) : (
        <table className="diet-ranking-table">
          <thead>
            <tr>
              <th>순위</th>
              <th>음식명</th>
              <th>섭취횟수</th>
              <th>총 칼로리</th>
              <th>총 단백질</th>
              <th>총 지방</th>
              <th>총 탄수화물</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((item, idx) => (
              <tr key={item.name}>
                <td>{idx + 1}</td>
                <td>{item.name}</td>
                <td>{item.count}</td>
                <td>{item.totalCal.toFixed(2)}</td>
                <td>{item.totalProtein.toFixed(2)}</td>
                <td>{item.totalFat.toFixed(2)}</td>
                <td>{item.totalCarb.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
