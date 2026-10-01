import { showAlert, showConfirm } from '../../../../utils/dialogs';
// src/features/weight/components/WeightManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import WeightChart from "./WeightChart";
import styles from "./css/WeightManagement.module.css";
import { storage } from "utils/storage";


/* ---------- utils ---------- */
const fmt = (d) => {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};
const todayStr = fmt(new Date());
const isISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");

/* users source가 제각각일 수 있으므로 강건하게 수집 */
function collectUsers() {
  const byKey = new Map();

  // 1) 통합 users 오브젝트
  const usersObj = storage.get("users") || {};
  Object.values(usersObj).forEach((u) => {
    const userKey = u.userKey || u.id || u.username || u.email || "";
    if (!userKey) return;
    byKey.set(userKey, {
      userKey,
      id: u.id ?? u.email ?? userKey,
      role: u.role || u.profile?.role || "MEMBER",
      name: u.profile?.username || u.username || u.nickname || userKey,
    });
  });

  // 2) weightRecords에만 존재하는 유저 키
  const wMap = storage.get("weightRecords") || {};
  Object.keys(wMap).forEach((uk) => {
    if (!uk) return;
    if (!byKey.has(uk)) {
      byKey.set(uk, {
        userKey: uk,
        id: uk,
        role: "MEMBER",
        name: uk,
      });
    }
  });

  // 3) 기타 모듈에서 남긴 userKey 힌트(diet/exercise)
  const dMap = storage.get("dietRecords") || {};
  Object.keys(dMap).forEach((uk) => {
    if (!uk) return;
    if (!byKey.has(uk)) {
      byKey.set(uk, { userKey: uk, id: uk, role: "MEMBER", name: uk });
    }
  });
  const eMap = storage.get("exerciseRecords") || {};
  Object.keys(eMap).forEach((uk) => {
    if (!uk) return;
    if (!byKey.has(uk)) {
      byKey.set(uk, { userKey: uk, id: uk, role: "MEMBER", name: uk });
    }
  });

  return Array.from(byKey.values());
}

export default function WeightManagement() {
  /* ------- state ------- */
  const [allMap, setAllMap] = useState(storage.get("weightRecords") || {}); // { userKey: [{date,weight}] }
  const [search, setSearch] = useState("");
  const [onlyWithData, setOnlyWithData] = useState(true);
  const [startDate, setStartDate] = useState(fmt(new Date(Date.now() - 30 * 86400000)));
  const [endDate, setEndDate] = useState(todayStr);

  const [activeUser, setActiveUser] = useState(null);
  const [editDate, setEditDate] = useState(null);
  const [editWeight, setEditWeight] = useState("");

  /* ------- users ------- */
  const users = useMemo(() => collectUsers(), []);
  const userRows = useMemo(() => {
    const rows = users.map((u) => {
      const arr = (allMap[u.userKey] || []).filter((r) => r.date >= startDate && r.date <= endDate);
      const count = arr.length;
      const first = count ? arr.map((r) => r.date).sort()[0] : null;
      const last = count ? arr.map((r) => r.date).sort().slice(-1)[0] : null;
      return { ...u, count, first, last };
    });

    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (onlyWithData && r.count === 0) return false;
        if (!q) return true;
        return (
          String(r.name).toLowerCase().includes(q) ||
          String(r.id).toLowerCase().includes(q) ||
          String(r.userKey).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.last || "").localeCompare(a.last || ""));
  }, [users, allMap, startDate, endDate, search, onlyWithData]);

  const activeRecords = useMemo(() => {
    if (!activeUser) return [];
    return (allMap[activeUser] || [])
      .filter((r) => r.date >= startDate && r.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [activeUser, allMap, startDate, endDate]);

  /* ------- actions ------- */
  const loadAll = () => setAllMap(storage.get("weightRecords") || {});

  const beginEdit = (rec) => {
    setEditDate(rec.date);
    setEditWeight(String(rec.weight));
  };
  const cancelEdit = () => {
    setEditDate(null);
    setEditWeight("");
  };
  const saveEdit = () => {
    if (!activeUser || !editDate) return;
    if (editWeight === "" || Number.isNaN(Number(editWeight))) {
      showAlert("체중을 숫자로 입력하세요.");
      return;
    }
    const map = { ...(allMap || {}) };
    const list = (map[activeUser] || []).slice();
    const idx = list.findIndex((r) => r.date === editDate);
    if (idx >= 0) list[idx] = { date: editDate, weight: Number(editWeight) };
    map[activeUser] = list;
    storage.set("weightRecords", map);
    setAllMap(map);
    cancelEdit();
  };
  const removeRec = async (date) => {
    if (!activeUser) return;
    if (!await showConfirm(`${date} 기록을 삭제할까요?`)) return;
    const map = { ...(allMap || {}) };
    map[activeUser] = (map[activeUser] || []).filter((r) => r.date !== date);
    storage.set("weightRecords", map);
    setAllMap(map);
    if (editDate === date) cancelEdit();
  };

  /* ------- UI ------- */
  return (
    <div className={styles.wrap}>
      <h2 className={styles.pageTitle}>⚙️ 체중 관리</h2>

      <div className={styles.toolbar}>
        <div className={styles.toolRow}>
          <input
            className={styles.search}
            placeholder="이름/ID/userKey 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className={styles.label}>시작</label>
          <input
            type="date"
            className={styles.date}
            value={startDate}
            onChange={(e) => isISO(e.target.value) && setStartDate(e.target.value)}
          />
          <label className={styles.label}>종료</label>
          <input
            type="date"
            className={styles.date}
            value={endDate}
            onChange={(e) => isISO(e.target.value) && setEndDate(e.target.value)}
          />
          <label className={styles.chkLabel}>
            <input
              type="checkbox"
              checked={onlyWithData}
              onChange={(e) => setOnlyWithData(e.target.checked)}
            />
            데이터 있는 유저만
          </label>
        </div>
      </div>

      <div className={styles.grid}>
        {/* LEFT: users */}
        <div className={styles.leftCard}>
          <div className={styles.cardHeader}>사용자</div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>사용자</th>
                  <th>역할</th>
                  <th>건수</th>
                  <th>최초</th>
                  <th>최신</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {userRows.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={styles.empty}>해당 기간 데이터가 없습니다.</td>
                  </tr>
                ) : (
                  userRows.map((u) => (
                    <tr key={u.userKey} className={u.userKey === activeUser ? styles.active : ""}>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.userId}>{u.name || u.userKey}</div>
                          <div className={styles.subtle}>id:{u.id} • key:{u.userKey}</div>
                        </div>
                      </td>
                      <td>{u.role}</td>
                      <td>{u.count}</td>
                      <td>{u.first ? u.first : "-"}</td>
                      <td>{u.last ? u.last : "-"}</td>
                      <td>
                        <button className={styles.btnSmall} onClick={() => setActiveUser(u.userKey)}>
                          보기
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: detail */}
        <div className={styles.rightCard}>
          {!activeUser ? (
            <div className={styles.placeholder}>왼쪽에서 사용자를 선택하세요.</div>
          ) : (
            <>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.subtle}>선택된 사용자</div>
                  <div className={styles.activeUser}>{activeUser}</div>
                </div>
                <div className={styles.rightHeaderBtns}>
                  <button className={styles.btnGhost} onClick={loadAll}>새로고침</button>
                </div>
              </div>

              <div className={styles.chartCard}>
                <WeightChart records={activeRecords} title="체중 추이" yLabel="kg" />
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: "140px" }}>날짜</th>
                      <th style={{ width: "160px" }}>체중(kg)</th>
                      <th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRecords.length === 0 ? (
                      <tr>
                        <td colSpan="3" className={styles.empty}>기록 없음</td>
                      </tr>
                    ) : (
                      activeRecords.map((r) => {
                        const isEdit = editDate === r.date;
                        return (
                          <tr key={r.date}>
                            <td>{r.date}</td>
                            <td>
                              {isEdit ? (
                                <input
                                  className={styles.input}
                                  type="number"
                                  value={editWeight}
                                  onChange={(e) => setEditWeight(e.target.value)}
                                  inputMode="decimal"
                                />
                              ) : (
                                <span>{r.weight}</span>
                              )}
                            </td>
                            <td>
                              {!isEdit ? (
                                <>
                                  <button className={styles.btnSmall} onClick={() => beginEdit(r)}>수정</button>
                                  <button className={styles.btnDanger} onClick={() => removeRec(r.date)}>삭제</button>
                                </>
                              ) : (
                                <>
                                  <button className={styles.btnPrimary} onClick={saveEdit}>저장</button>
                                  <button className={styles.btnGhost} onClick={cancelEdit}>취소</button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
