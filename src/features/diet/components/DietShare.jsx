import React, { useEffect, useState } from "react";
import { storage } from "../../../utils/storage";
import styles from "../css/DietShare.module.css";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend
);

function fmtLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function getRole(u) {
  return (
    u?.role ||
    u?.profile?.role ||
    u?.authorities?.[0]?.role ||
    u?.authorities?.[0]?.role_name ||
    "GUEST"
  );
}

function DietShare() {
  const today = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(today.getDate() - 7);

  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [startDate, setStartDate] = useState(fmtLocal(oneWeekAgo));
  const [endDate, setEndDate] = useState(fmtLocal(today));
  const [foods, setFoods] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [topFoods, setTopFoods] = useState([]);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(0);

  const currentAuth = storage.get("currentAuth") || null;
  const myRole =
    currentAuth?.role ||
    currentAuth?.profile?.role ||
    currentAuth?.authorities?.[0]?.role ||
    currentAuth?.authorities?.[0]?.role_name ||
    "GUEST";
  const isGuest = myRole === "GUEST";

  useEffect(() => {
    const list = storage.listUsers?.() || [];
    const membersOnly = list
      .filter((u) => getRole(u) === "MEMBER")
      .map((u) => ({
        key: u.userKey || u.key || u.id,
        id: u.id || u.username || u.userKey || "",
      }));
    setAllUsers(membersOnly);
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    const allData = storage.get("dietRecords") || {};
    const userFoods = allData[selectedUser.key] || [];
    const inRange = userFoods.filter((f) => f.date >= startDate && f.date <= endDate);
    setFoods(inRange);

    const cmtKey = `dietComments::${selectedUser.key}::${startDate}~${endDate}`;
    setComments(storage.get(cmtKey) || []);

    const counter = {};
    inRange.forEach((f) => {
      if (!f.name) return;
      counter[f.name] = (counter[f.name] || 0) + (f.quantity || 1);
    });
    setTopFoods(Object.entries(counter).sort((a, b) => b[1] - a[1]).slice(0, 10));
    setPage(0);
  }, [selectedUser, startDate, endDate]);

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedUser) return;
    const current = storage.get("currentAuth");
    let nickname = "익명";
    if (current?.id) {
      const me = storage.getUserById?.(current.id) || null;
      nickname =
        me?.profile?.nickname ||
        me?.profile?.username ||
        current?.username ||
        current?.id ||
        "익명";
    }
    const cmt = { id: Date.now(), text: newComment.trim(), author: nickname };
    const cmtKey = `dietComments::${selectedUser.key}::${startDate}~${endDate}`;
    const next = [...comments, cmt];
    storage.set(cmtKey, next);
    setComments(next);
    setNewComment("");
  };

  const dailyCalories = {};
  foods.forEach((f) => {
    const q = f.quantity || 1;
    const cal = (Number(f.energy) || 0) * q;
    dailyCalories[f.date] = (dailyCalories[f.date] || 0) + cal;
  });
  const totals = foods.reduce(
    (acc, f) => {
      const q = f.quantity || 1;
      acc.protein += (Number(f.protein) || 0) * q;
      acc.fat += (Number(f.fat) || 0) * q;
      acc.carb += (Number(f.carb) || 0) * q;
      return acc;
    },
    { protein: 0, fat: 0, carb: 0 }
  );

  const labels = [];
  for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
    labels.push(fmtLocal(new Date(d)));
  }
  const barValues = labels.map((d) => dailyCalories[d] || 0);

  const chartData = {
    labels,
    datasets: [
      { type: "bar", label: "일별 칼로리", data: barValues, backgroundColor: "#42a5f5", order: 2 },
      { type: "line", label: "변화추이", data: barValues, borderColor: "red", borderWidth: 2, fill: false, tension: 0.2, pointRadius: 4, order: 1 },
    ],
  };
  const pieData = {
    labels: ["단백질", "지방", "탄수화물"],
    datasets: [{ data: [totals.protein, totals.fat, totals.carb], backgroundColor: ["#4caf50", "#ff9800", "#2196f3"] }],
  };

  const flatFoods = [...foods]
    .map((f) => ({ ...f, _kcal: (Number(f.energy) || 0) * (f.quantity || 1) }))
    .sort((a, b) => (a.date === b.date ? (a.time || "").localeCompare(b.time || "") : b.date.localeCompare(a.date)));
  const totalPages = Math.max(1, Math.ceil(flatFoods.length / PAGE_SIZE));
  const pageFoods = flatFoods.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  if (isGuest) {
    return (
      <div className={styles.dietShareContainer}>
        <h2>👥 식단 공유</h2>
        <p className={styles.mealsEmpty}>게스트 모드에서는 식단 공유를 사용할 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={styles.dietShareContainer}>
      <h2>👥 식단 공유</h2>

      <div className={styles.formSection}>
        <div className={styles.field}>
          <label>사용자</label>
          <div className={styles.selectWrap}>
            <select
              value={selectedUser?.key || ""}
              onChange={(e) => {
                const user = allUsers.find((u) => u.key === e.target.value);
                setSelectedUser(user || null);
              }}
            >
              <option value="">-- 선택 --</option>
              {allUsers.map((u) => (
                <option key={u.key} value={u.key}>{u.id}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label>시작일</label>
          <input className={styles.input} type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
        </div>

        <div className={styles.field}>
          <label>종료일</label>
          <input className={styles.input} type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
        </div>
      </div>

      {selectedUser && (
        <div className={styles.infoRow}>
          <div className={`${styles.card} ${styles.mealsCard}`}>
            <div className={styles.cardHeader}>
              <h3>🍽️ 기간 내 식단</h3>
              <div className={styles.pager}>
                <button
                  className={styles.pagerBtn}
                  disabled={page===0}
                  onClick={()=>setPage((p)=>Math.max(0,p-1))}
                >이전</button>
                <span className={styles.pagerText}>{page+1}/{totalPages}</span>
                <button
                  className={styles.pagerBtn}
                  disabled={page>=totalPages-1}
                  onClick={()=>setPage((p)=>Math.min(totalPages-1,p+1))}
                >다음</button>
              </div>
            </div>
            {pageFoods.length === 0 ? (
              <p className={styles.mealsEmpty}>기록이 없습니다.</p>
            ) : (
              <ul className={styles.mealsList}>
                {pageFoods.map((f) => (
                  <li key={f.id} className={styles.mealsItem}>
                    <span className={styles.mealDate}>{f.date}</span>
                    <span className={styles.mealBadge}>{f.mealType || "-"}</span>
                    <span className={styles.mealName}>{f.name}</span>
                    <span className={styles.mealQty}>×{f.quantity || 1}</span>
                    {f.time ? <span className={styles.mealTime}>{f.time}</span> : <span />}
                    <span className={styles.mealKcal}>{Math.round(f._kcal)} kcal</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={`${styles.card} ${styles.topFoods}`}>
            <h3>🏆 인기 식단 TOP 10</h3>
            {topFoods.length === 0 ? (
              <p className={styles.mealsEmpty}>데이터 없음</p>
            ) : (
              <ol className={styles.rankList}>
                {topFoods.map(([name, count], idx) => (
                  <li key={name}>
                    <span className={styles.rankNo}>{idx+1}</span>
                    <span className={styles.rankName}>{name}</span>
                    <span className={styles.rankCount}>{count}회</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}

      {selectedUser && (
        <>
          <div className={styles.chartRow}>
            <div className={`${styles.chartCard} ${styles.bar}`}>
              <h3>🔥 일별 칼로리 & 변화추이</h3>
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  scales: { y: { beginAtZero: true, suggestedMax: 3500 } },
                }}
              />
            </div>

            <div className={`${styles.chartCard} ${styles.pie}`}>
              <h3>🥗 탄단지 비율</h3>
              <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: true, aspectRatio: 1 }} />
            </div>
          </div>

          <div className={styles.commentSection}>
            <h3>💬 코멘트</h3>
            <ul>
              {comments.map((c) => (
                <li key={c.id}><strong>{c.author}:</strong> {c.text}</li>
              ))}
            </ul>
            <div className={styles.commentForm}>
              <input
                type="text"
                placeholder="코멘트를 입력하세요"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button onClick={handleAddComment}>등록</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DietShare;
