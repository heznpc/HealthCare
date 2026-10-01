import { showAlert } from '../../../../utils/dialogs';
// src/features/admin/views/ExerciseManagement/ExerciseManager.jsx
import React, { useEffect, useMemo, useState } from "react";
import styles from "./css/ExerciseManagement.module.css";
import { storage } from "../../../../utils/storage";

const ymd = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
};
const sorter = (a,b)=> a.date!==b.date ? b.date.localeCompare(a.date)
  : (b.time||"").localeCompare(a.time||"");
const toArray = (v)=> Array.isArray(v)?v : v && typeof v==="object" ? Object.values(v) : [];
const s = (v)=> v==null? "" : String(v);

// 운동시설 즐겨찾기 가져오기 - HealthMap의 새로운 구조에 맞게 수정
const getUserFacilityFavorites = (userKey) => {
  if (!userKey) return [];
  const favoritesKey = `healthmap_favorites_${userKey}`;
  const favorites = storage.get(favoritesKey, 'local') || [];
  
  console.log(`즐겨찾기 데이터 (${userKey}):`, favorites);
  
  // 새로운 객체 형태의 즐겨찾기 데이터 처리
  return favorites.map(fav => {
    if (typeof fav === 'object' && fav.ft_idx) {
      // 이미 완전한 객체 형태로 저장된 경우
      return fav;
    } else if (typeof fav === 'string') {
      // 기존 ID만 저장된 경우 (하위 호환성)
      return { ft_idx: fav };
    }
    return fav;
  }).filter(Boolean);
};

// ---- 유저 로딩/메타 ----
function readAllUsers(){
  const a1 = toArray(storage.get("user_db")?.user);
  const a2 = toArray(storage.get("users"));
  return [...a1, ...a2];
}
function extractKey(u){
  return (
    u?.userKey ||
    (u?.id!=null ? String(u.id) : "") ||
    u?.username ||
    u?.nickname ||
    (u?.email ? u.email.split("@")[0] : "")
  );
}
function buildMetaByKey(){
  const m = new Map();
  for(const u of readAllUsers()){
    const key = extractKey(u); if(!key) continue;
    const role =
      u?.role || u?.profile?.role || u?.authorities?.[0]?.role || u?.authorities?.[0]?.role_name || "USER";
    m.set(key,{
      id: u?.id ?? null,
      userKey: key,
      username: u?.username || u?.profile?.username || null,
      nickname: u?.nickname || u?.profile?.nickname || null,
      name: u?.name || u?.profile?.name || null,
      display: u?.profile?.username || u?.name || u?.username || u?.nickname || u?.profile?.nickname || key,
      email: u?.email || u?.profile?.email || "",
      role,
    });
  }
  const ca = storage.get("currentAuth")||{};
  const caKey = ca?.userKey || (ca?.id!=null?String(ca.id):"") || ca?.username || (ca?.email?ca.email.split("@")[0]:"");
  if(caKey && !m.has(caKey)){
    m.set(caKey,{
      id: ca?.id ?? null,
      userKey: caKey,
      username: ca?.username || null,
      nickname: ca?.nickname || null,
      name: ca?.name || null,
      display: ca?.name || ca?.profile?.username || ca?.username || caKey,
      email: ca?.email || "",
      role: ca?.role || "USER",
    });
  }
  return m;
}

const PAGE=10;

export default function ExerciseManager(){
  const today = ymd(new Date());
  const monthAgo = ymd(new Date(Date.now()-29*86400000));

  const [q,setQ] = useState("");
  const [onlyHasData,setOnlyHasData] = useState(false);
  const [dateStart,setDateStart] = useState(monthAgo);
  const [dateEnd,setDateEnd] = useState(today);
  const [selectedKey,setSelectedKey] = useState(null);

  const [editingId,setEditingId] = useState(null);
  const [edit,setEdit] = useState({date:"",time:"",name:"",reps:"",minutes:"",kcal:"",imageUrl:""});
  
  const [facilityFavorites, setFacilityFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);

  const allMap = storage.get("exerciseRecords")||{};
  const metaByKey = useMemo(()=>buildMetaByKey(),[]);
  const allUserKeys = useMemo(()=>{
    const set = new Set(metaByKey.keys());
    if(allMap && typeof allMap==="object") Object.keys(allMap).forEach(k=>k&&set.add(k));
    return Array.from(set);
  },[metaByKey,allMap]);

  // 목록
  const users = useMemo(()=>{
    const rows = allUserKeys.map(ukey=>{
      const list = Array.isArray(allMap?.[ukey]) ? allMap[ukey] : [];
      const within = list.filter(r=> r.date>=dateStart && r.date<=dateEnd);
      const dates = within.map(r=>r.date).sort();
      const meta = metaByKey.get(ukey) || {display:ukey,role:"USER",email:"",id:null,username:null,userKey:ukey};
      return {
        ...meta,
        count: within.length,
        sumKcal: within.reduce((a,r)=>a+(+r.kcal||0),0),
        firstDate: dates[0]||null,
        lastDate: dates.at?.(-1)||dates[dates.length-1]||null,
      };
    }).filter(r=>{
      if(onlyHasData && r.count===0) return false;
      if(q){
        const k=q.toLowerCase();
        const hit = s(r.display).toLowerCase().includes(k)
          || s(r.userKey).toLowerCase().includes(k)
          || s(r.username).toLowerCase().includes(k)
          || s(r.id).toLowerCase().includes(k)
          || s(r.email).toLowerCase().includes(k);
        if(!hit) return false;
      }
      return true;
    });
    rows.sort((a,b)=>{
      const la=a.lastDate||"", lb=b.lastDate||"";
      if(la!==lb) return (lb||"").localeCompare(la||"");
      if(a.count!==b.count) return b.count-a.count;
      return String(a.display).localeCompare(String(b.display));
    });
    return rows;
  },[allUserKeys,allMap,dateStart,dateEnd,onlyHasData,q,metaByKey]);

  useEffect(()=>{ if(!selectedKey && users.length>0) setSelectedKey(users[0].userKey); },[users,selectedKey]);
  
  // HealthMap에서 이미 완전한 시설 데이터를 저장하므로 별도 API 호출 불필요

  // 선택된 사용자의 운동시설 즐겨찾기 로드
  useEffect(() => {
    if (selectedKey) {
      const favorites = getUserFacilityFavorites(selectedKey);
      console.log(`사용자 ${selectedKey}의 즐겨찾기:`, favorites);
      setFacilityFavorites(favorites);
    } else {
      setFacilityFavorites([]);
    }
  }, [selectedKey]);

  // 상세
  const detail = useMemo(()=>{
    if(!selectedKey) return [];
    const arr = Array.isArray(allMap[selectedKey]) ? allMap[selectedKey] : [];
    return arr.filter(r=> r.date>=dateStart && r.date<=dateEnd).slice().sort(sorter);
  },[allMap,selectedKey,dateStart,dateEnd]);

  const [page,setPage] = useState(1);
  useEffect(()=>{ setPage(1); },[selectedKey,dateStart,dateEnd]);
  const totalPages = Math.max(1, Math.ceil(detail.length/PAGE));
  const visible = detail.slice((page-1)*PAGE, (page-1)*PAGE+PAGE);

  // 편집
  const startEdit=(r)=>{
    setEditingId(r.id);
    setEdit({date:r.date,time:r.time||"00:00:00",name:r.name,reps:s(r.reps),minutes:s(r.minutes),kcal:s(r.kcal),imageUrl:r.imageUrl||""});
  };
  const cancelEdit=()=>setEditingId(null);
  const saveEdit=()=>{
    const name=(edit.name||"").trim();
    const reps=parseInt(edit.reps,10);
    const minutes=parseFloat(edit.minutes);
    const kcal=parseFloat(edit.kcal);
    const d=edit.date||today, t=edit.time||"00:00:00";
    if(!selectedKey) return;
    if(!name) return showAlert("운동명을 입력하세요.");
    if(!Number.isFinite(reps)||reps<0) return showAlert("횟수는 0 이상 정수.");
    if(!Number.isFinite(minutes)||minutes<0) return showAlert("시간(분)은 0 이상 숫자.");
    if(!Number.isFinite(kcal)||kcal<0) return showAlert("칼로리는 0 이상 숫자.");
    const map=storage.get("exerciseRecords")||{};
    const mine=Array.isArray(map[selectedKey])?map[selectedKey]:[];
    map[selectedKey]=mine.map(r=> r.id===editingId ? {...r,date:d,time:t,name,reps,minutes,kcal,imageUrl:edit.imageUrl||""} : r).sort(sorter);
    storage.set("exerciseRecords",map);
    setEditingId(null);
  };
  const removeRecord=(id)=>{
    if(!selectedKey) return;
    const map=storage.get("exerciseRecords")||{};
    const mine=Array.isArray(map[selectedKey])?map[selectedKey]:[];
    map[selectedKey]=mine.filter(r=>r.id!==id).sort(sorter);
    storage.set("exerciseRecords",map);
    if(editingId===id) setEditingId(null);
  };

  return (
    <section className={styles.wrap}>
      <h2 className={styles.title}>운동 관리</h2>

      {/* 필터 */}
      <div className={styles.filters}>
        <input className={styles.input} placeholder="이름/ID/userKey 검색" value={q} onChange={(e)=>setQ(e.target.value)}/>
        <select className={styles.input} value="all" readOnly><option value="all">전체</option></select>
        <input type="date" className={styles.input} value={dateStart} onChange={(e)=>setDateStart(e.target.value)}/>
        <input type="date" className={styles.input} value={dateEnd} onChange={(e)=>setDateEnd(e.target.value)}/>
        <label className={styles.chk}>
          <input type="checkbox" checked={onlyHasData} onChange={(e)=>setOnlyHasData(e.target.checked)}/>
          데이터 있는 유저만
        </label>
      </div>

      <div className={styles.panelRow}>
        {/* 사용자 목록 */}
        <div className={styles.userCard}>
          <div className={styles.userHeader}>사용자</div>
          <div className={styles.userList}>
            {users.length===0 ? (
              <div className={styles.empty}>조건에 맞는 유저가 없습니다.</div>
            ) : users.map(u=>(
              <button
                key={u.userKey}
                className={`${styles.userItem} ${selectedKey===u.userKey?styles.active:""}`}
                onClick={()=>setSelectedKey(u.userKey)}
                title={u.userKey}
              >
                <div className={styles.userTop}>
                  <b>{u.display}</b>
                  <span className={styles.role}>{u.role}</span>
                </div>
                <div className={styles.userSub}>
                  <span>id:{u.id ?? "-"}</span>
                  <span> · username:{u.username ?? "-"}</span>
                  <span> · key:{u.userKey}</span>
                </div>
                <div className={styles.userMeta}>
                  <span>건수 {u.count}</span>
                  <span>총 kcal {u.sumKcal}</span>
                  <span>최초 {u.firstDate || "-"}</span>
                  <span>최신 {u.lastDate || "-"}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 상세 */}
        <div className={styles.detailCard}>
          <div className={styles.detailHeader}>
            {selectedKey ? (
              <>
                <div>
                  <b>{(metaByKey.get(selectedKey)?.display)||selectedKey}</b>
                  <span className={styles.userKeySmall}>
                    {" "}· id:{metaByKey.get(selectedKey)?.id ?? "-"} · username:{metaByKey.get(selectedKey)?.username ?? "-"} · key:{selectedKey}
                  </span>
                </div>
                <div className={styles.pager}>
                  <button onClick={()=>setPage(1)} disabled={page<=1}>«</button>
                  <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>‹</button>
                  <span>{page}/{totalPages}</span>
                  <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}>›</button>
                  <button onClick={()=>setPage(totalPages)} disabled={page>=totalPages}>»</button>
                </div>
              </>
            ) : <span>왼쪽에서 사용자를 선택하세요.</span>}
          </div>

          {selectedKey && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>이미지</th><th>날짜</th><th>시간</th><th>운동명</th>
                  <th>횟수</th><th>시간(분)</th><th>칼로리</th><th>관리</th>
                </tr>
              </thead>
              <tbody>
                {visible.length===0 ? (
                  <tr><td colSpan={8} className={styles.empty}>기록이 없습니다.</td></tr>
                ) : visible.map(r =>
                  editingId===r.id ? (
                    <tr key={r.id} className={styles.editRow}>
                      <td>
                        {edit.imageUrl ? <img src={edit.imageUrl} alt="thumb" className={styles.thumb}/> : <span className={styles.noImg}>없음</span>}
                        <input className={styles.input} placeholder="이미지 URL" value={edit.imageUrl} onChange={(e)=>setEdit(p=>({...p,imageUrl:e.target.value}))}/>
                      </td>
                      <td><input type="date" className={styles.input} value={edit.date} onChange={(e)=>setEdit(p=>({...p,date:e.target.value}))}/></td>
                      <td><input type="time" step="1" className={styles.input} value={edit.time} onChange={(e)=>setEdit(p=>({...p,time:e.target.value}))}/></td>
                      <td><input className={styles.input} value={edit.name} onChange={(e)=>setEdit(p=>({...p,name:e.target.value}))}/></td>
                      <td><input type="number" min="0" className={styles.input} value={edit.reps} onChange={(e)=>setEdit(p=>({...p,reps:e.target.value}))}/></td>
                      <td><input type="number" min="0" step="0.1" className={styles.input} value={edit.minutes} onChange={(e)=>setEdit(p=>({...p,minutes:e.target.value}))}/></td>
                      <td><input type="number" min="0" step="1" className={styles.input} value={edit.kcal} onChange={(e)=>setEdit(p=>({...p,kcal:e.target.value}))}/></td>
                      <td className={styles.actions}>
                        <button className={styles.saveBtn} onClick={saveEdit}>저장</button>
                        <button className={styles.cancelBtn} onClick={cancelEdit}>취소</button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={r.id}>
                      <td>{r.imageUrl ? <img src={r.imageUrl} alt="thumb" className={styles.thumb}/> : <span className={styles.noImg}>없음</span>}</td>
                      <td>{r.date}</td>
                      <td>{r.time||""}</td>
                      <td>{r.name}</td>
                      <td>{r.reps}</td>
                      <td>{Number(r.minutes).toFixed(1)}</td>
                      <td>{Number(r.kcal).toFixed(0)}</td>
                      <td className={styles.actions}>
                        <button className={styles.editBtn} onClick={()=>startEdit(r)}>수정</button>
                        <button className={styles.delBtn} onClick={()=>removeRecord(r.id)}>삭제</button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
          
          {/* 운동시설 즐겨찾기 섹션 */}
          {selectedKey && (
            <div className={styles.favoritesSection}>
              <div className={styles.favoritesHeader}>
                <h4>즐겨찾기 운동시설 ({facilityFavorites.length})</h4>
                <button 
                  className={styles.toggleBtn}
                  onClick={() => setShowFavorites(!showFavorites)}
                >
                  {showFavorites ? '숨기기' : '보기'}
                </button>
              </div>
              
              {showFavorites && (
                <div className={styles.facilitiesList}>
                  {facilityFavorites.length === 0 ? (
                    <div className={styles.empty}>즐겨찾기한 운동시설이 없습니다.</div>
                  ) : (
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>시설명</th>
                          <th>주소</th>
                          <th>운동 종목</th>
                          <th>시설 구분</th>
                          <th>전화번호</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facilityFavorites.map((favorite, index) => {
                          // HealthMap에서 저장한 완전한 객체 데이터 활용
                          console.log(`즐겨찾기 ${index}:`, favorite);
                          return (
                            <tr key={favorite.ft_idx || index}>
                              <td>{favorite.title || `시설 ID: ${favorite.ft_idx}`}</td>
                              <td>{favorite.address || '정보 없음'}</td>
                              <td>{favorite.kind || '정보 없음'}</td>
                              <td>{favorite.type || '정보 없음'}</td>
                              <td>{favorite.phone || '정보 없음'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
