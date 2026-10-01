import { showAlert, showConfirm } from '../../../../utils/dialogs';
// src/features/admin/diet/DietManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import styles from "./css/DietManagement.module.css";
import { storage } from "utils/storage";


const PAGE_SIZE = 10;

const fmtDate = (s) => {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const fmtDateTime = (date, time) => {
  const ds = fmtDate(date);
  return time ? `${ds} ${time}` : ds;
};
const kcalOf = (r) => (Number(r.energy) || 0) * (Number(r.quantity) || 1);

// ---- 편집 모달 ----
function EditRecordModal({ open, record, onClose, onSave }) {
  const [form, setForm] = useState(null);
  useEffect(() => {
    if (!record) return;
    setForm({
      id: record.id,
      date: record.date || "",
      time: record.time || "",
      mealType: record.mealType || "",
      name: record.name || "",
      quantity: Number(record.quantity) || 1,
      energy: Number(record.energy) || 0,
      protein: Number(record.protein) || 0,
      fat: Number(record.fat) || 0,
      carb: Number(record.carb) || 0,
    });
  }, [record]);

  if (!open || !form) return null;

  const change = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const submit = () => {
    if (!form.name.trim()) return showAlert("음식명을 입력하세요.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) return showAlert("날짜를 확인하세요.");
    if (Number.isNaN(Number(form.quantity)) || Number(form.quantity) <= 0) return showAlert("수량은 양수여야 합니다.");
    const clean = {
      ...form,
      quantity: Number(form.quantity),
      energy: Number(form.energy) || 0,
      protein: Number(form.protein) || 0,
      fat: Number(form.fat) || 0,
      carb: Number(form.carb) || 0,
    };
    onSave(clean);
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h4>식단 기록 수정</h4>
          <button className={styles.btn} onClick={onClose}>닫기</button>
        </div>
        <div className={styles.formGrid}>
          <label>
            <span>날짜</span>
            <input type="date" value={form.date} onChange={(e) => change("date", e.target.value)} />
          </label>
          <label>
            <span>시간</span>
            <input type="time" value={form.time} onChange={(e) => change("time", e.target.value)} />
          </label>
          <label>
            <span>구분</span>
            <input type="text" placeholder="아침/점심/저녁/간식…" value={form.mealType} onChange={(e) => change("mealType", e.target.value)} />
          </label>
          <label className={styles.col2}>
            <span>음식명</span>
            <input type="text" value={form.name} onChange={(e) => change("name", e.target.value)} />
          </label>
          <label>
            <span>수량</span>
            <input type="number" step="0.1" value={form.quantity} onChange={(e) => change("quantity", e.target.value)} />
          </label>
          <label>
            <span>kcal(1개당)</span>
            <input type="number" step="1" value={form.energy} onChange={(e) => change("energy", e.target.value)} />
          </label>
          <label>
            <span>단백(g)</span>
            <input type="number" step="0.1" value={form.protein} onChange={(e) => change("protein", e.target.value)} />
          </label>
          <label>
            <span>지방(g)</span>
            <input type="number" step="0.1" value={form.fat} onChange={(e) => change("fat", e.target.value)} />
          </label>
          <label>
            <span>탄수(g)</span>
            <input type="number" step="0.1" value={form.carb} onChange={(e) => change("carb", e.target.value)} />
          </label>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.btn} onClick={submit}>저장</button>
        </div>
      </div>
    </div>
  );
}

export default function DietManagement() {
  // 사용자 목록
  const users = useMemo(() => {
    const list = storage.listUsers ? storage.listUsers(false) : Object.values(storage.get("users") || {});
    return list.map((u) => ({
      userKey: u.userKey,
      id: u.id,
      role: u.role || u.profile?.role || "MEMBER",
      name: u.profile?.username || u.username || u.id || u.userKey,
    }));
  }, []);

  // 기록 상태(수정/삭제 반영)
  const [allRecords, setAllRecords] = useState(storage.get("dietRecords") || {});

  // 필터
  const [q, setQ] = useState("");
  const [mealType, setMealType] = useState("전체");
  const [onlyWithData, setOnlyWithData] = useState(true);
  const today = fmtDate(new Date());
  const start30 = fmtDate(new Date(Date.now() - 29 * 86400000));
  const [startDate, setStartDate] = useState(start30);
  const [endDate, setEndDate] = useState(today);

  // 선택
  const [selectedUserKey, setSelectedUserKey] = useState(null);
  const [page, setPage] = useState(1);

  // 편집 모달
  const [editing, setEditing] = useState(null); // { userKey, record }

  // 식사 타입 후보
  const mealTypes = useMemo(() => {
    const set = new Set();
    Object.values(allRecords).forEach((arr) =>
      (arr || []).forEach((r) => r.mealType && set.add(r.mealType))
    );
    return ["전체", ...Array.from(set)];
  }, [allRecords]);

  // 유저별 요약
  const userRows = useMemo(() => {
    const sd = startDate;
    const ed = endDate;

    const rows = users.map((u) => {
      const list = (allRecords[u.userKey] || []).filter((r) => {
        if (r.date < sd || r.date > ed) return false;
        if (mealType !== "전체" && r.mealType !== mealType) return false;
        return true;
      });
      const total = list.length;
      const kcal = Math.round(list.reduce((a, r) => a + kcalOf(r), 0));
      const firstDate = total ? list.map((r) => r.date).sort()[0] : null;
      const lastDate = total ? list.map((r) => r.date).sort().slice(-1)[0] : null;

      return { ...u, total, kcal, firstDate, lastDate };
    });

    const qLower = q.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (onlyWithData && r.total === 0) return false;
      if (!qLower) return true;
      return (
        String(r.name).toLowerCase().includes(qLower) ||
        String(r.id).toLowerCase().includes(qLower) ||
        String(r.userKey).toLowerCase().includes(qLower)
      );
    });

    filtered.sort((a, b) => {
      const ad = a.lastDate || "";
      const bd = b.lastDate || "";
      if (ad !== bd) return bd.localeCompare(ad);
      return b.kcal - a.kcal;
    });

    return filtered;
  }, [users, allRecords, mealType, startDate, endDate, q, onlyWithData]);

  // 선택 유저
  const selectedUser = useMemo(
    () => users.find((u) => u.userKey === selectedUserKey) || null,
    [users, selectedUserKey]
  );

  // 상세 레코드
  const detailRecords = useMemo(() => {
    if (!selectedUser) return [];
    const list = (allRecords[selectedUser.userKey] || []).filter((r) => {
      if (r.date < startDate || r.date > endDate) return false;
      if (mealType !== "전체" && r.mealType !== mealType) return false;
      return true;
    });
    list.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.time || "").localeCompare(a.time || "");
    });
    return list;
  }, [selectedUser, allRecords, startDate, endDate, mealType]);

  const totalPages = Math.max(1, Math.ceil(detailRecords.length / PAGE_SIZE));
  const pageRecords = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return detailRecords.slice(start, start + PAGE_SIZE);
  }, [detailRecords, page]);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, mealType, selectedUserKey]);

  const detailSum = useMemo(() => {
    const s = pageRecords.reduce(
      (acc, r) => {
        const q = Number(r.quantity) || 1;
        acc.kcal += (Number(r.energy) || 0) * q;
        acc.protein += (Number(r.protein) || 0) * q;
        acc.fat += (Number(r.fat) || 0) * q;
        acc.carb += (Number(r.carb) || 0) * q;
        return acc;
      },
      { kcal: 0, protein: 0, fat: 0, carb: 0 }
    );
    return {
      kcal: Math.round(s.kcal),
      protein: +s.protein.toFixed(1),
      fat: +s.fat.toFixed(1),
      carb: +s.carb.toFixed(1),
    };
  }, [pageRecords]);

  // ---- 삭제 ----
  const handleDelete = async (rec) => {
    if (!selectedUser) return;
    if (!await showConfirm("이 기록을 삭제할까요?")) return;

    const all = { ...(allRecords || {}) };
    const arr = (all[selectedUser.userKey] || []).filter((r) => r.id !== rec.id);
    all[selectedUser.userKey] = arr;
    storage.set("dietRecords", all);
    setAllRecords(all);

    // 페이지 보정
    const newTotalPages = Math.max(1, Math.ceil(Math.max(0, detailRecords.length - 1) / PAGE_SIZE));
    setPage((p) => Math.min(p, newTotalPages));
  };

  // ---- 수정 ----
  const openEdit = (rec) => {
    if (!selectedUser) return;
    setEditing({ userKey: selectedUser.userKey, record: rec });
  };
  const saveEdit = (updated) => {
    const uk = editing.userKey;
    const all = { ...(allRecords || {}) };
    const arr = (all[uk] || []).map((r) => (r.id === updated.id ? { ...r, ...updated } : r));
    all[uk] = arr;
    storage.set("dietRecords", all);
    setAllRecords(all);
    setEditing(null);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h2>🍱 식단 관리</h2>
        <div className={styles.filters}>
          <input
            className={styles.input}
            placeholder="이름/ID/userKey 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className={styles.select} value={mealType} onChange={(e) => setMealType(e.target.value)}>
            {mealTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <label className={styles.rangeItem}>
            시작
            <input type="date" className={styles.input} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label className={styles.rangeItem}>
            종료
            <input type="date" className={styles.input} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          <label className={styles.chk}>
            <input type="checkbox" checked={onlyWithData} onChange={(e) => setOnlyWithData(e.target.checked)} />
            데이터 있는 유저만
          </label>
        </div>
      </div>

      <div className={styles.grid}>
        {/* 좌: 유저 목록 */}
        <div className={styles.left}>
          <div className={styles.card}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>사용자</th>
                    <th>역할</th>
                    <th>건수</th>
                    <th>총 kcal</th>
                    <th>최초</th>
                    <th>최신</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {userRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.empty}>조건에 맞는 사용자가 없습니다.</td>
                    </tr>
                  ) : (
                    userRows.map((u) => (
                      <tr key={u.userKey} className={u.userKey === selectedUserKey ? styles.active : ""}>
                        <td>
                          <div className={styles.userCell}>
                            <div className={styles.userName}>{u.name}</div>
                            <div className={styles.userSub}>id:{u.id} • key:{u.userKey}</div>
                          </div>
                        </td>
                        <td>{u.role}</td>
                        <td>{u.total}</td>
                        <td>{u.kcal}</td>
                        <td>{fmtDate(u.firstDate)}</td>
                        <td>{fmtDate(u.lastDate)}</td>
                        <td>
                          <button className={styles.btn} onClick={() => setSelectedUserKey(u.userKey)}>
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
        </div>

        {/* 우: 상세 */}
        <div className={styles.right}>
          <div className={styles.card}>
            <div className={styles.detailHeader}>
              <div className={styles.detailTitle}>
                {selectedUser ? (
                  <>
                    <b>{selectedUser.name}</b> 식단 상세
                    <span className={styles.muted}>
                      &nbsp;({startDate} ~ {endDate}{mealType !== "전체" ? `, ${mealType}` : ""})
                    </span>
                  </>
                ) : (
                  "사용자를 선택하세요"
                )}
              </div>
              {selectedUser && (
                <div className={styles.detailKpis}>
                  <div className={styles.kpiBox}><span>표시 kcal</span><strong>{detailSum.kcal}</strong></div>
                  <div className={styles.kpiBox}><span>단백(g)</span><strong>{detailSum.protein}</strong></div>
                  <div className={styles.kpiBox}><span>지방(g)</span><strong>{detailSum.fat}</strong></div>
                  <div className={styles.kpiBox}><span>탄수(g)</span><strong>{detailSum.carb}</strong></div>
                </div>
              )}
            </div>

            {!selectedUser ? (
              <div className={styles.emptyPanel}>왼쪽에서 사용자를 선택하세요.</div>
            ) : detailRecords.length === 0 ? (
              <div className={styles.emptyPanel}>선택한 조건의 기록이 없습니다.</div>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>일시</th>
                        <th>구분</th>
                        <th>음식</th>
                        <th>수량</th>
                        <th>kcal</th>
                        <th>단백</th>
                        <th>지방</th>
                        <th>탄수</th>
                        <th>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRecords.map((r) => {
                        const qv = Number(r.quantity) || 1;
                        const kcal = (Number(r.energy) || 0) * qv;
                        const p = (Number(r.protein) || 0) * qv;
                        const f = (Number(r.fat) || 0) * qv;
                        const c = (Number(r.carb) || 0) * qv;
                        return (
                          <tr key={r.id}>
                            <td>{fmtDateTime(r.date, r.time)}</td>
                            <td>{r.mealType || "-"}</td>
                            <td className={styles.foodName}>{r.name}</td>
                            <td>{qv}</td>
                            <td>{kcal.toFixed(0)}</td>
                            <td>{p.toFixed(1)}</td>
                            <td>{f.toFixed(1)}</td>
                            <td>{c.toFixed(1)}</td>
                            <td className={styles.actions}>
                              <button className={styles.btnSm} onClick={() => openEdit(r)}>수정</button>
                              <button className={`${styles.btnSm} ${styles.danger}`} onClick={() => handleDelete(r)}>삭제</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className={styles.pagination}>
                  <button className={styles.btn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    이전
                  </button>
                  <span className={styles.pageInfo}>{page} / {totalPages}</span>
                  <button className={styles.btn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    다음
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 편집 모달 */}
      <EditRecordModal
        open={!!editing}
        record={editing?.record}
        onClose={() => setEditing(null)}
        onSave={saveEdit}
      />
    </div>
  );
}
