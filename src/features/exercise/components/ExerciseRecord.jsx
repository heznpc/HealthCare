import { showAlert, showGuestLimit } from '../../../utils/dialogs';
import { guestPolicy } from '../../../utils/guestStorage';
import GuestNotice from '../../../components/commons/GuestNotice';
// src/features/exercise/components/ExerciseRecord.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { storage } from "../../../utils/storage";
import styles from "../css/ExerciseRecord.module.css";

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const G_KEY = process.env.REACT_APP_GOOGLE_SEARCH_KEY;
const G_CX  = process.env.REACT_APP_GOOGLE_CX_KEY;

const PAGE_SIZE = 10;

function fmtDateLocal(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function fmtTimeLocal(d = new Date()) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
function sorter(a, b) {
  if (a.date !== b.date) return b.date.localeCompare(a.date);
  if ((a.time || "") !== (b.time || "")) return (b.time || "").localeCompare(a.time || "");
  return b.id - a.id;
}
function isValidDateStr(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || ""); }

// 선형계수 추정: kcal ≈ a*minutes + b*reps
function estimateCoeffs(samples) {
  let Smm = 0, Srr = 0, Smr = 0, Smy = 0, Sry = 0;
  for (const s of samples) {
    const m = Number(s.minutes) || 0;
    const r = Number(s.reps) || 0;
    const y = Number(s.kcal) || 0;
    Smm += m * m; Srr += r * r; Smr += m * r; Smy += m * y; Sry += r * y;
  }
  const det = Smm * Srr - Smr * Smr;
  if (det <= 1e-6) {
    const avgPm = samples.length
      ? samples.reduce((a, s) => a + (Number(s.kcal)||0) / Math.max(1, Number(s.minutes)||0), 0) / samples.length
      : 3;
    const avgPr = samples.length
      ? samples.reduce((a, s) => a + (Number(s.kcal)||0) / Math.max(1, Number(s.reps)||0), 0) / samples.length
      : 5;
    return { a: Math.max(0, avgPm * 0.7), b: Math.max(0, avgPr * 0.3) };
  }
  const a = (Smy * Srr - Sry * Smr) / det;
  const b = (Sry * Smm - Smy * Smr) / det;
  return { a: Math.max(0, a), b: Math.max(0, b) };
}

export default function ExerciseRecord() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDate = searchParams.get("date");
  const initDate = isValidDateStr(urlDate) ? urlDate : fmtDateLocal();

  const [userKey, setUserKey] = useState(null);
  const [records, setRecords] = useState([]);

  // 페이징
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));

  // 추가 폼(= 조회 기준 날짜로도 사용)
  const [date, setDate] = useState(initDate);
  const [time, setTime] = useState(fmtTimeLocal());
  const [form, setForm] = useState({ name: "", reps: "", minutes: "", kcal: "" });
  const [imageUrl, setImageUrl] = useState("");
  const [aiPending, setAiPending] = useState(false);
  const [aiErr, setAiErr] = useState("");

  // 이미지 모드(추가)
  const [imgMode, setImgMode] = useState("auto");
  const [manualUrl, setManualUrl] = useState("");

  // 수정 폼
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ date: "", time: "", name: "", reps: "", minutes: "", kcal: "", imageUrl: "" });
  const [editAIPending, setEditAIPending] = useState(false);
  const [editErr, setEditErr] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  // 이미지 모드(수정)
  const [editImgMode, setEditImgMode] = useState("auto");
  const [editManualUrl, setEditManualUrl] = useState("");

  // 권한
  const currentAuth = storage.get("currentAuth") || null;
  const myRole =
    currentAuth?.role ||
    currentAuth?.profile?.role ||
    currentAuth?.authorities?.[0]?.role ||
    currentAuth?.authorities?.[0]?.role_name ||
    "GUEST";
  const isGuest = myRole === "GUEST";

  // 게스트 한도

  // URL 동기화
  useEffect(() => {
    const next = new URLSearchParams();
    next.set("date", date);
    if (page > 1) next.set("page", String(page));
    setSearchParams(next, { replace: true });
  }, [date, page, setSearchParams]);

  // 사용자 키 및 기록 로드
  useEffect(() => {
    const current = storage.get("currentAuth");
    const key = current?.userKey || "guest";
    setUserKey(key);
    const all = storage.get("exerciseRecords") || {};
    setRecords([...(all[key] || [])].sort(sorter));

  }, []);

  // 동일 운동 히스토리
  const exerciseHistory = useMemo(() => {
    const nm = form.name?.trim();
    if (!nm) return [];
    return records.filter((r) => (r.name || "").trim() === nm).slice(0, 30);
  }, [records, form.name]);
  const editExerciseHistory = useMemo(() => {
    const nm = editForm.name?.trim();
    if (!nm) return [];
    return records.filter((r) => (r.name || "").trim() === nm && r.id !== editingId).slice(0, 30);
  }, [records, editForm.name, editingId]);

  // 날짜 필터링 + 페이징
  const filtered = useMemo(() => records.filter((r) => r.date === date), [records, date]);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [page, totalPages]);
  const start = (page - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  // 이미지 검색 공통
  async function fetchImage(query, setFn) {
    try {
      const params = new URLSearchParams({
        key: G_KEY,
        cx: G_CX,
        searchType: "image",
        q: `${query} exercise`,
        num: "6",
        safe: "active",
      });
      const resp = await fetch(`https://www.googleapis.com/customsearch/v1?${params.toString()}`);
      const data = await resp.json();
      const items = Array.isArray(data.items) ? data.items : [];
      const link =
        items.find((i) => i?.link)?.link ||
        items.find((i) => i?.image?.thumbnailLink)?.image?.thumbnailLink ||
        "";
      setFn(link);
    } catch {
      setFn("");
    }
  }

  // 추가 폼: 이름 바뀌면 자동검색
  useEffect(() => {
    const q = form.name?.trim();
    if (imgMode !== "auto") return;
    if (!q) { setImageUrl(""); return; }
    let aborted = false;
    (async () => { if (!aborted) await fetchImage(q, (url)=>!aborted && setImageUrl(url)); })();
    return () => { aborted = true; };
  }, [form.name, imgMode]);

  useEffect(() => {
    if (imgMode !== "auto") return;
    const q = form.name?.trim();
    if (q) fetchImage(q, setImageUrl);
  }, [imgMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // 수정 폼: 이름 바뀌면 자동검색
  useEffect(() => {
    if (!editingId) return;
    const q = editForm.name?.trim();
    if (editImgMode !== "auto") return;
    if (!q) { setEditImageUrl(""); return; }
    let aborted = false;
    (async () => { if (!aborted) await fetchImage(q, (url)=>!aborted && setEditImageUrl(url)); })();
    return () => { aborted = true; };
  }, [editForm.name, editingId, editImgMode]);

  useEffect(() => {
    if (editImgMode !== "auto" || !editingId) return;
    const q = editForm.name?.trim();
    if (q) fetchImage(q, setEditImageUrl);
  }, [editImgMode, editingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
  };

  // 날짜 변경 시 페이징 초기화
  const onChangeDate = (v) => {
    setDate(v);
    setPage(1);
  };

  // AI 칼로리 추정 공통
  async function aiEstimate(nm, reps, mins, hist, setFn, setPending, setErr) {
    setErr("");
    const coeffs = estimateCoeffs(hist);
    const localEst = Math.max(0, Math.round(coeffs.a * (mins || 0) + coeffs.b * (reps || 0)));
    const histLines = hist
      .slice(0, 12)
      .map((r) => `date=${r.date}, time=${r.time || ""}, name=${r.name}, reps=${r.reps}, minutes=${r.minutes}, kcal=${r.kcal}`)
      .join("\n");
    const prompt = `
당신은 운동 칼로리 추정기다.
규칙:
- 결과는 숫자만 한 줄. 단위/설명 금지.
- reps/minutes가 커지면 kcal도 감소하지 않음.
- 아래 과거 기록과 선형계수 힌트를 참고.

[과거 기록(최대 12개)]
${histLines || "(없음)"}

[선형계수 힌트]
kcal ≈ a*minutes + b*reps, a=${coeffs.a.toFixed(3)}, b=${coeffs.b.toFixed(3)}

[새 입력]
name=${nm}, reps=${Number.isFinite(reps)?reps:0}, minutes=${Number.isFinite(mins)?mins:0}

반환: 정수 kcal, 숫자만.
    `.trim();

    try {
      setPending(true);
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You output only a positive integer." },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 8,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error?.message || "AI 실패");
      const raw = String(data?.choices?.[0]?.message?.content || "").trim();
      const m = raw.match(/-?\d+(\.\d+)?/);
      const aiVal = m ? Math.round(parseFloat(m[0])) : NaN;

      const histMax = hist.reduce((mx, r) => Math.max(mx, Number(r.kcal) || 0), 0);
      const val = Number.isFinite(aiVal) ? aiVal : localEst;
      const safe = Math.max(val, Math.min(localEst, histMax || 0));
      setFn(String(Math.max(0, safe)));
    } catch (err) {
      setErr(err.message || "AI 오류");
      setFn(String(localEst));
    } finally {
      setPending(false);
    }
  }

  // 추가 폼 디바운스 AI
  useEffect(() => {
    const nm = form.name?.trim();
    const reps = Number(form.reps);
    const mins = Number(form.minutes);
    if (!nm || (!Number.isFinite(reps) && !Number.isFinite(mins))) return;
    const t = setTimeout(() => {
      aiEstimate(nm, reps, mins, exerciseHistory, (v)=>setForm(p=>({...p,kcal:v})), setAiPending, setAiErr);
    }, 600);
    return () => clearTimeout(t);
  }, [form.name, form.reps, form.minutes, exerciseHistory]);

  // 수정 폼 디바운스 AI
  useEffect(() => {
    if (!editingId) return;
    const nm = editForm.name?.trim();
    const reps = Number(editForm.reps);
    const mins = Number(editForm.minutes);
    if (!nm || (!Number.isFinite(reps) && !Number.isFinite(mins))) return;
    const t = setTimeout(() => {
      aiEstimate(nm, reps, mins, editExerciseHistory, (v)=>setEditForm(p=>({...p,kcal:v})), setEditAIPending, setEditErr);
    }, 600);
    return () => clearTimeout(t);
  }, [editForm.name, editForm.reps, editForm.minutes, editExerciseHistory, editingId]);

  // 추가 (비로그인 체험 저장 횟수 확인)
  const addRecord = () => {
    if (!userKey) return showAlert("로그인 상태를 확인하세요.");
    const name = form.name.trim();
    const reps = parseInt(form.reps, 10);
    const minutes = parseFloat(form.minutes);
    let kcal = parseFloat(form.kcal);
    const t = time || fmtTimeLocal();

    if (!name) return showAlert("운동명을 입력하세요.");
    if (!Number.isFinite(reps) || reps < 0) return showAlert("횟수는 0 이상 정수.");
    if (!Number.isFinite(minutes) || minutes < 0) return showAlert("시간(분)은 0 이상 숫자.");
    if (!Number.isFinite(kcal) || kcal < 0) {
      const coeffs = estimateCoeffs(exerciseHistory);
      kcal = Math.round(coeffs.a * (minutes || 0) + coeffs.b * (reps || 0));
    }

    const all = storage.get("exerciseRecords") || {};
    const mine = all[userKey] || [];

    const entry = { id: Date.now(), date, time: t, name, reps, minutes, kcal, imageUrl: imageUrl || "" };
    const next = [entry, ...mine].sort(sorter);
    all[userKey] = next;
    if (!guestPolicy.save(userKey, () => storage.set("exerciseRecords", all))) {
      showGuestLimit();
      return;
    }
    setRecords(next);

    setForm({ name: "", reps: "", minutes: "", kcal: "" });
    setImageUrl("");
    setManualUrl("");
    setImgMode("auto");
    setTime(fmtTimeLocal());
  };

  // 삭제
  const removeRecord = (id) => {
    const all = storage.get("exerciseRecords") || {};
    const mine = all[userKey] || [];
    const next = mine.filter((r) => r.id !== id).sort(sorter);
    all[userKey] = next;
    storage.set("exerciseRecords", all);
    setRecords(next);
    if (editingId === id) { setEditingId(null); }
  };

  // 수정 시작/취소/저장
  const startEdit = (r) => {
    setEditingId(r.id);
    setEditForm({
      date: r.date,
      time: r.time || "00:00:00",
      name: r.name,
      reps: String(r.reps),
      minutes: String(r.minutes),
      kcal: String(r.kcal),
      imageUrl: r.imageUrl || "",
    });
    setEditImageUrl(r.imageUrl || "");
    setEditManualUrl(r.imageUrl || "");
    setEditImgMode("manual");
    setEditErr("");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditErr("");
    setEditImgMode("auto");
    setEditManualUrl("");
  };
  const saveEdit = () => {
    const name = editForm.name.trim();
    const reps = parseInt(editForm.reps, 10);
    const minutes = parseFloat(editForm.minutes);
    const kcal = parseFloat(editForm.kcal);
    const d = editForm.date || fmtDateLocal();
    const t = editForm.time || "00:00:00";
    const img = editImageUrl || editForm.imageUrl || "";

    if (!name) return showAlert("운동명을 입력하세요.");
    if (!Number.isFinite(reps) || reps < 0) return showAlert("횟수는 0 이상 정수.");
    if (!Number.isFinite(minutes) || minutes < 0) return showAlert("시간(분)은 0 이상 숫자.");
    if (!Number.isFinite(kcal) || kcal < 0) return showAlert("칼로리는 0 이상 숫자.");

    const all = storage.get("exerciseRecords") || {};
    const mine = all[userKey] || [];
    const next = mine
      .map((r) => (r.id === editingId ? { ...r, date: d, time: t, name, reps, minutes, kcal, imageUrl: img } : r))
      .sort(sorter);
    all[userKey] = next;
    if (!guestPolicy.save(userKey, () => storage.set("exerciseRecords", all))) {
      showGuestLimit();
      return;
    }
    setRecords(next);
    setEditingId(null);
    setEditImgMode("auto");
    setEditManualUrl("");
  };

  // 파일→DataURL 미리보기
  const handleFileToImageUrl = (file) => {
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => setImageUrl(String(fr.result || ""));
    fr.readAsDataURL(file);
  };
  const handleEditFileToImageUrl = (file) => {
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => setEditImageUrl(String(fr.result || ""));
    fr.readAsDataURL(file);
  };

  return (
    <section className={styles.wrap}>
      <h2 className={styles.title}>🏋️ 운동 기록</h2>

      {isGuest && (
        <div className={styles.guestNotice}><GuestNotice /></div>
      )}

      <div className={styles.topRow}>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label}>날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => onChangeDate(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>시간</label>
            <input type="time" step="1" value={time} onChange={(e) => setTime(e.target.value)} className={styles.input} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>운동명</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="스쿼트" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>횟수(회)</label>
            <input name="reps" type="number" min="0" value={form.reps} onChange={handleChange} placeholder="10" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>시간(분)</label>
            <input name="minutes" type="number" min="0" step="0.1" value={form.minutes} onChange={handleChange} placeholder="30" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>칼로리(kcal)</label>
            <div className={styles.kcalRow}>
              <input name="kcal" type="number" min="0" step="1" value={form.kcal} onChange={handleChange} placeholder={aiPending ? "AI 계산중…" : "자동 산출"} className={styles.input} />
              <span className={styles.aiBadge}>{aiPending ? "AI" : "AUTO"}</span>
            </div>
            {aiErr ? <p className={styles.err}>{aiErr}</p> : null}
          </div>

          <button onClick={addRecord} className={styles.addBtn}>추가</button>
        </div>

        <div className={styles.imageWrap}>
          {imageUrl ? <img src={imageUrl} alt="exercise" className={styles.previewImage} /> : <div className={styles.noImage}>이미지 없음</div>}
          <div className={styles.imgControls}>
            <div className={styles.imgModeRow}>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name="imgmode"
                  value="auto"
                  checked={imgMode === "auto"}
                  onChange={() => setImgMode("auto")}
                /> 자동 검색
              </label>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name="imgmode"
                  value="manual"
                  checked={imgMode === "manual"}
                  onChange={() => setImgMode("manual")}
                /> 수동
              </label>
            </div>

            {imgMode === "manual" && (
              <>
                <div className={styles.urlRow}>
                  <input
                    type="url"
                    placeholder="이미지 URL 붙여넣기"
                    value={manualUrl}
                    onChange={(e)=>setManualUrl(e.target.value)}
                    className={styles.input}
                  />
                  <button
                    type="button"
                    className={styles.smallBtn}
                    onClick={()=> setImageUrl(manualUrl.trim())}
                  >적용</button>
                </div>
                <div className={styles.fileRow}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e)=>handleFileToImageUrl(e.target.files?.[0])}
                  />
                </div>
                <div className={styles.rowGap}>
                  <button type="button" className={styles.smallBtnSecondary} onClick={()=>{ setImageUrl(""); setManualUrl(""); }}>
                    초기화
                  </button>
                </div>
                <p className={styles.helper}>URL 또는 파일 중 하나를 사용하세요.</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        {/* 페이저 상단 */}
        <div className={styles.pager} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.5rem 0" }}>
          <div>총 {total}건 · {page}/{totalPages}페이지</div>
          <div style={{ display:"flex", gap:"0.5rem" }}>
            <button onClick={()=>setPage(1)} disabled={page<=1}>« 처음</button>
            <button onClick={()=>setPage(p=>Math.max(1, p-1))} disabled={page<=1}>‹ 이전</button>
            <button onClick={()=>setPage(p=>Math.min(totalPages, p+1))} disabled={page>=totalPages}>다음 ›</button>
            <button onClick={()=>setPage(totalPages)} disabled={page>=totalPages}>끝 »</button>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>이미지</th>
              <th>날짜</th>
              <th>시간</th>
              <th>운동명</th>
              <th>횟수</th>
              <th>시간(분)</th>
              <th>칼로리</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={8} className={styles.empty}>기록이 없습니다.</td></tr>
            ) : (
              visible.map((r) =>
                editingId === r.id ? (
                  <tr key={r.id} className={styles.editRow}>
                    <td>
                      {editImageUrl ? <img src={editImageUrl} alt="thumb" className={styles.thumb} /> : <span className={styles.noImgText}>없음</span>}
                      <div className={styles.imgControlsTight}>
                        <div className={styles.imgModeRow}>
                          <label className={styles.radio}>
                            <input
                              type="radio"
                              name={`editimgmode-${editingId}`}
                              value="auto"
                              checked={editImgMode === "auto"}
                              onChange={()=>setEditImgMode("auto")}
                            /> 자동
                          </label>
                          <label className={styles.radio}>
                            <input
                              type="radio"
                              name={`editimgmode-${editingId}`}
                              value="manual"
                              checked={editImgMode === "manual"}
                              onChange={()=>setEditImgMode("manual")}
                            /> 수동
                          </label>
                        </div>
                        {editImgMode === "manual" && (
                          <>
                            <div className={styles.urlRow}>
                              <input
                                type="url"
                                placeholder="이미지 URL"
                                value={editManualUrl}
                                onChange={(e)=>setEditManualUrl(e.target.value)}
                                className={styles.input}
                              />
                              <button
                                type="button"
                                className={styles.smallBtn}
                                onClick={()=> setEditImageUrl(editManualUrl.trim())}
                              >적용</button>
                            </div>
                            <div className={styles.fileRow}>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e)=>handleEditFileToImageUrl(e.target.files?.[0])}
                              />
                            </div>
                            <button
                              type="button"
                              className={styles.smallBtnSecondary}
                              onClick={()=>{ setEditImageUrl(""); setEditManualUrl(""); }}
                            >초기화</button>
                          </>
                        )}
                      </div>
                    </td>
                    <td><input type="date" value={editForm.date} onChange={handleEditChange} name="date" className={styles.input} /></td>
                    <td><input type="time" step="1" value={editForm.time} onChange={handleEditChange} name="time" className={styles.input} /></td>
                    <td><input value={editForm.name} onChange={handleEditChange} name="name" className={styles.input} /></td>
                    <td><input type="number" min="0" value={editForm.reps} onChange={handleEditChange} name="reps" className={styles.input} /></td>
                    <td><input type="number" min="0" step="0.1" value={editForm.minutes} onChange={handleEditChange} name="minutes" className={styles.input} /></td>
                    <td>
                      <div className={styles.kcalRow}>
                        <input type="number" min="0" step="1" value={editForm.kcal} onChange={handleEditChange} name="kcal" className={styles.input} />
                        <span className={styles.aiBadge}>{editAIPending ? "AI" : "AUTO"}</span>
                      </div>
                      {editErr ? <p className={styles.err}>{editErr}</p> : null}
                    </td>
                    <td className={styles.actions}>
                      <button className={styles.saveBtn} onClick={saveEdit}>저장</button>
                      <button className={styles.cancelBtn} onClick={cancelEdit}>취소</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id}>
                    <td>{r.imageUrl ? <img src={r.imageUrl} alt="thumb" className={styles.thumb} /> : <span className={styles.noImgText}>없음</span>}</td>
                    <td>{r.date}</td>
                    <td>{r.time || ""}</td>
                    <td>{r.name}</td>
                    <td>{r.reps}</td>
                    <td>{Number(r.minutes).toFixed(1)}</td>
                    <td>{Number(r.kcal).toFixed(0)}</td>
                    <td className={styles.actions}>
                      <button className={styles.editBtn} onClick={() => startEdit(r)}>수정</button>
                      <button className={styles.delBtn} onClick={() => removeRecord(r.id)}>삭제</button>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>

        {/* 페이저 하단 */}
        <div className={styles.pager} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.5rem 0" }}>
          <div>총 {total}건 · {page}/{totalPages}페이지</div>
          <div style={{ display:"flex", gap:"0.5rem" }}>
            <button onClick={()=>setPage(1)} disabled={page<=1}>« 처음</button>
            <button onClick={()=>setPage(p=>Math.max(1, p-1))} disabled={page<=1}>‹ 이전</button>
            <button onClick={()=>setPage(p=>Math.min(totalPages, p+1))} disabled={page>=totalPages}>다음 ›</button>
            <button onClick={()=>setPage(totalPages)} disabled={page>=totalPages}>끝 »</button>
          </div>
        </div>
      </div>
    </section>
  );
}
