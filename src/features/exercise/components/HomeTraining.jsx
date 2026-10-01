import { showAlert } from '../../../utils/dialogs';
import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { storage } from "utils/storage";
import { useAuth } from "auth/useAuth";
import styles from "../css/HomeTraining.module.css";

const CATEGORIES = [
  { key: "yoga", label: "요가", q: "요가 홈트" },
  { key: "pilates", label: "필라테스", q: "필라테스 홈트" },
  { key: "hiit", label: "HIIT", q: "HIIT home workout" },
  { key: "stretch", label: "스트레칭", q: "전신 스트레칭" },
  { key: "abs", label: "복근", q: "복근 운동 홈트" },
];

const KEY = "AIzaSyDZXd321QOR2tWqZa1HD6ieFlxLNSjsGDQ";

const LS_LAST_RESULTS = "homeTraining::lastResults";
const LS_FAVS        = "homeTraining::favsV2";
const LS_COMMENTS_V1 = "homeTraining::comments";
const LS_VIEWS_V1    = "homeTraining::views";
const LS_COMMENTS    = "homeTraining::global::commentsV2";
const LS_VIEWS       = "homeTraining::global::viewsV2";
const LS_CURRENT     = "homeTraining::currentVideo";
const LS_RECS        = "homeTraining::recsV1";

const fmtCount = (n) => Number(n || 0).toLocaleString();

function toYouTubeId(urlOrId = "") {
  const s = String(urlOrId).trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m1 = s.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (m1) return m1[1];
  const m2 = s.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (m2) return m2[1];
  const m3 = s.match(/\/embed\/([A-Za-z0-9_-]{11})/);
  if (m3) return m3[1];
  return "";
}
const thumbFromId = (id) => (id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : "");
const embedFromId = (id) => (id ? `https://www.youtube.com/embed/${id}` : "");

export default function HomeTraining() {
  const { user, isAuthenticated } = useAuth();
  const userKey = user?.userKey || user?.id || user?.username || "guest";
  const isGuest = !isAuthenticated || userKey === "guest";

  const [params, setParams] = useSearchParams();
  const watchId = params.get("watch");

  const [tab, setTab] = useState("category"); // category | favs | recs
  const [query, setQuery] = useState(CATEGORIES[0].q);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [current, setCurrent] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");

  const [favVersion, setFavVersion] = useState(0);
  const [viewsVersion, setViewsVersion] = useState(0);
  const [recsVersion, setRecsVersion] = useState(0);
  const incrementedRef = useRef("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const v2c = storage.get(LS_COMMENTS);
    const v1c = storage.get(LS_COMMENTS_V1);
    if (!v2c && v1c) storage.set(LS_COMMENTS, v1c);

    const v2v = storage.get(LS_VIEWS);
    const v1v = storage.get(LS_VIEWS_V1);
    if (!v2v && v1v) storage.set(LS_VIEWS, v1v);
  }, []);

  const urlForSearch = (q) => {
    const u = new URL("https://www.googleapis.com/youtube/v3/search");
    u.search = new URLSearchParams({
      key: KEY, part: "snippet", q, type: "video",
      maxResults: "12", videoEmbeddable: "true", safeSearch: "moderate",
    }).toString();
    return u.toString();
  };
  const urlForVideo = (idOrCsv) => {
    const u = new URL("https://www.googleapis.com/youtube/v3/videos");
    u.search = new URLSearchParams({ key: KEY, part: "snippet", id: idOrCsv }).toString();
    return u.toString();
  };

  const getViewCount = (id) => Number((storage.get(LS_VIEWS) || {})[id] || 0);
  const bumpView = (id) => {
    const m = storage.get(LS_VIEWS) || {};
    m[id] = Number(m[id] || 0) + 1;
    storage.set(LS_VIEWS, m);
    setViewsVersion((v) => v + 1);
  };

  const readFavState = (uKey) => {
    const raw = storage.get(LS_FAVS) || {};
    const val = raw[uKey];
    if (Array.isArray(val)) return { raw, ids: val, items: {} };
    return { raw, ids: Array.isArray(val?.ids) ? val.ids : [], items: val?.items || {} };
  };
  const writeFavState = (uKey, raw, ids, items) => {
    raw[uKey] = { ids, items };
    storage.set(LS_FAVS, raw);
    setFavVersion((v) => v + 1);
  };
  const favState = useMemo(() => readFavState(userKey), [userKey, favVersion]);
  const favSet = useMemo(() => new Set(favState.ids), [favState]);

  const getFavCountGlobal = (vid) => {
    const map = storage.get(LS_FAVS) || {};
    let cnt = 0;
    Object.values(map).forEach((val) => {
      if (Array.isArray(val)) { if (val.includes(vid)) cnt++; }
      else if (val?.ids?.includes?.(vid)) cnt++;
    });
    return cnt;
  };

  const toggleFav = (video) => {
    const { raw, ids, items } = readFavState(userKey);
    const idx = ids.indexOf(video.id);
    if (idx >= 0) {
      ids.splice(idx, 1);
      delete items[video.id];
      writeFavState(userKey, raw, ids, items);
      return;
    }
    if (!isAuthenticated && ids.length >= 5) {
      showAlert("게스트는 즐겨찾기를 최대 5개까지 저장할 수 있습니다. 로그인 후 무제한 이용하세요.");
      return;
    }
    ids.push(video.id);
    items[video.id] = { id: video.id, title: video.title, thumb: video.thumb };
    writeFavState(userKey, raw, ids, items);
  };

  const readRecs = () => {
    const val = storage.get(LS_RECS);
    if (val && typeof val === "object") {
      const ids = Array.isArray(val.ids) ? val.ids.map(toYouTubeId).filter(Boolean) : [];
      const items = val.items && typeof val.items === "object" ? val.items : {};
      return { ids, items };
    }
    return { ids: [], items: {} };
  };

  const recState = useMemo(() => readRecs(), [recsVersion]);
  const recList = useMemo(() => {
    return recState.ids
      .map((id) => {
        const it = recState.items[id];
        const title = it?.title || "(제목 없음)";
        return { id, title, thumb: thumbFromId(id) };
      })
      .filter((v) => !!v.id);
  }, [recState]);

  useEffect(() => {
    const missing = recState.ids.filter((id) => !(recState.items[id]?.title));
    if (!missing.length || !KEY) return;
    const chunks = [];
    for (let i = 0; i < missing.length; i += 50) chunks.push(missing.slice(i, i + 50));
    (async () => {
      const base = storage.get(LS_RECS) || { ids: [], items: {} };
      base.items = base.items || {};
      for (const ch of chunks) {
        try {
          const r = await fetch(urlForVideo(ch.join(",")));
          const data = await r.json();
          (data.items || []).forEach((it) => {
            const id = it.id;
            const title = it.snippet?.title || "(제목 없음)";
            const prev = base.items[id] || {};
            base.items[id] = {
              url: prev.url || `https://www.youtube.com/watch?v=${id}`,
              title,
              regdate: prev.regdate || new Date().toISOString(),
              moddate: new Date().toISOString(),
            };
          });
        } catch {}
      }
      storage.set(LS_RECS, base);
      setRecsVersion((v) => v + 1);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recState.ids.join("|")]);

  const search = async (q) => {
    if (!KEY) { showAlert("YouTube API 키 누락"); return; }
    setLoading(true);
    try {
      const r = await fetch(urlForSearch(q));
      const data = await r.json();
      const arr = (data.items || [])
        .map((v) => {
          const id = v.id?.videoId;
          if (!id) return null;
          return { id, title: v.snippet?.title, thumb: thumbFromId(id) };
        })
        .filter(Boolean);
      setVideos(arr);
      storage.set(LS_LAST_RESULTS, arr);
    } finally {
      setLoading(false);
    }
  };

  const ensureCurrentVideo = async (id) => {
    if (!id) { setCurrent(null); return; }
    const src = tab === "recs" ? recList : videos;
    const fromList = src.find((v) => v?.id === id);
    if (fromList) { setCurrent(fromList); storage.set(LS_CURRENT, fromList); return; }
    const cache = storage.get(LS_LAST_RESULTS) || [];
    const fromCache = cache.find((v) => v.id === id);
    if (fromCache) { setCurrent(fromCache); storage.set(LS_CURRENT, fromCache); return; }
    try {
      const r = await fetch(urlForVideo(id));
      const data = await r.json();
      const sn = data?.items?.[0]?.snippet;
      const v = { id, title: sn?.title || "(제목 없음)", thumb: thumbFromId(id) };
      setCurrent(v);
      storage.set(LS_CURRENT, v);
    } catch {
      const v = { id, title: "(제목 없음)", thumb: thumbFromId(id) };
      setCurrent(v);
      storage.set(LS_CURRENT, v);
    }
  };

  useEffect(() => { search(query); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    if (!watchId) { setCurrent(null); setComments([]); return; }
    ensureCurrentVideo(watchId);
    if (incrementedRef.current !== watchId) {
      bumpView(watchId);
      incrementedRef.current = watchId;
    }
    const all = storage.get(LS_COMMENTS) || {};
    setComments(Array.isArray(all[watchId]) ? all[watchId] : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchId, viewsVersion, tab, recList]);

  const [typing, setTyping] = useState(null);
  const onSubmit = (e) => { e.preventDefault(); search(query); setTab("category"); };
  const onChange = (e) => {
    setQuery(e.target.value);
    if (typing) clearTimeout(typing);
    setTyping(setTimeout(() => { search(e.target.value); setTab("category"); }, 400));
  };

  const openDetail = (v) => {
    setParams((p) => { const n = new URLSearchParams(p); n.set("watch", v.id); return n; });
    setCurrent(v);
    storage.set(LS_CURRENT, v);
    setExpanded(false);
  };
  const closeDetail = () => {
    const hadWatch = params.has("watch");
    setParams((p) => { const n = new URLSearchParams(p); n.delete("watch"); return n; }, { replace: hadWatch });
    setCurrent(null);
  };

  const addComment = () => {
    const content = commentInput.trim();
    if (!watchId || !content) return;
    if (isGuest) { showAlert("로그인 후 댓글을 작성할 수 있습니다."); return; }
    const username = user?.username || user?.id || "사용자";
    const c = { id: Date.now(), userKey, username, content, createdAt: new Date().toISOString() };
    const all = storage.get(LS_COMMENTS) || {};
    const arr = Array.isArray(all[watchId]) ? all[watchId] : [];
    const next = [c, ...arr];
    all[watchId] = next;
    storage.set(LS_COMMENTS, all);
    setComments(next);
    setCommentInput("");
  };
  const removeComment = (cid) => {
    if (!watchId) return;
    const all = storage.get(LS_COMMENTS) || {};
    const arr = Array.isArray(all[watchId]) ? all[watchId] : [];
    const next = arr.filter((c) => c.id !== cid);
    all[watchId] = next;
    storage.set(LS_COMMENTS, all);
    setComments(next);
  };

  const favList = useMemo(() => {
    const { ids, items } = favState;
    return ids.map((id) => {
      const t = items[id]?.title || "(제목 없음)";
      return { id, title: t, thumb: thumbFromId(id) };
    }).filter(Boolean);
  }, [favState]);

  const listVideos = tab === "favs" ? favList : tab === "recs" ? recList : videos;

  if (watchId && current) {
    const isFav = favSet.has(current.id);
    const favCnt = getFavCountGlobal(current.id);
    const views = getViewCount(current.id);

    return (
      <div className={styles.wrap}>
        <div className={`${styles.detailContainer} ${expanded ? styles.expanded : ""}`}>
          <div className={styles.detailBar}>
            <div className={styles.detailBarLeft}>
              <button onClick={closeDetail} className={styles.btnSec}>뒤로가기</button>
            </div>
            <div className={styles.detailBarRight}>
              <button
                onClick={() => setExpanded((v) => !v)}
                className={styles.btnSec}
                title={expanded ? "축소" : "크게 보기"}
              >
                {expanded ? "축소" : "크게 보기"}
              </button>
              <button
                onClick={() => toggleFav(current)}
                className={`${styles.btn} ${isFav ? styles.favActive : ""}`}
                title={isFav ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              >
                {isFav ? "★ 즐겨찾기" : "☆ 즐겨찾기"}
              </button>
            </div>
          </div>

          <h2 className={styles.detailTitle}>{current.title}</h2>

          <div className={styles.iframeWrap}>
            <iframe
              title={current.title}
              src={embedFromId(current.id)}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className={styles.iframe}
            />
          </div>

          <div className={styles.statsRow}>
            <span className={styles.stat}>조회수 {fmtCount(views)}회</span>
            <span className={styles.dot}>•</span>
            <span className={styles.stat}>즐겨찾기 {fmtCount(favCnt)}</span>
          </div>

          <section className={styles.commentSection}>
            <h3 className={styles.commentTitle}>코멘트</h3>
            <div className={styles.commentForm}>
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={isGuest ? "로그인 후 댓글을 작성할 수 있습니다" : "코멘트를 입력하세요"}
                className={styles.input}
                disabled={isGuest}
              />
              <button onClick={addComment} className={styles.btn} disabled={isGuest}>등록</button>
            </div>

            {comments.length === 0 ? (
              <p className={styles.emptyText}>첫 코멘트를 남겨보세요.</p>
            ) : (
              <ul className={styles.commentsList}>
                {comments.map((c) => (
                  <li key={c.id} className={styles.commentItem}>
                    <div className={styles.commentMeta}>
                      <div className={styles.metaLeft}>
                        <b>{c.username}</b>
                        <span className={styles.metaTime}>
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {c.userKey === userKey && (
                        <button onClick={() => removeComment(c.id)} className={styles.btnSmall}>삭제</button>
                      )}
                    </div>
                    <div className={styles.commentBody}>{c.content}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <button
          onClick={() => setTab("recs")}
          className={`${styles.btnSec} ${tab === "recs" ? styles.tabActive : ""}`}
          title="추천 영상"
        >
          추천
        </button>

        {CATEGORIES.map((c) => {
          const selected = tab === "category" && query === c.q;
          return (
            <button
              key={c.key}
              onClick={() => { setTab("category"); setQuery(c.q); search(c.q); }}
              className={`${styles.btn} ${selected ? styles.btnActive : ""}`}
              aria-pressed={selected}
            >
              {c.label}
            </button>
          );
        })}

        <button
          onClick={() => setTab("favs")}
          className={`${styles.btnSec} ${tab === "favs" ? styles.tabActive : ""}`}
          title="내 즐겨찾기 보기"
        >
          즐겨찾기
        </button>

        <form onSubmit={onSubmit} className={styles.searchForm}>
          <input
            value={query}
            onChange={onChange}
            placeholder="유튜브 검색어"
            className={styles.input}
            disabled={tab !== "category"}
          />
          <button type="submit" className={styles.btn} disabled={tab !== "category"}>검색</button>
        </form>
      </div>

      {tab === "category" && loading && <p className={styles.loading}>로딩 중</p>}
      {tab === "favs" && listVideos.length === 0 && <p className={styles.loading}>즐겨찾기한 영상이 없습니다.</p>}
      {tab === "recs" && listVideos.length === 0 && <p className={styles.loading}>추천 영상이 없습니다.</p>}

      <div className={styles.grid}>
        {listVideos.map((v) => {
          const isFav = favSet.has(v.id);
          const favCnt = getFavCountGlobal(v.id);
          const views = getViewCount(v.id);
          return (
            <div key={v.id} className={styles.card}>
              <button onClick={() => openDetail(v)} className={styles.thumbBtn}>
                <div className={styles.thumbWrap}>
                  <img src={v.thumb} alt={v.title} loading="lazy" className={styles.thumbImg} />
                  <div className={styles.thumbOverlay}>
                    <svg width="54" height="54" viewBox="0 0 24 24" fill="#fff" aria-hidden>
                      <path d="M8 5v14l11-7z"></path>
                    </svg>
                  </div>
                </div>
              </button>

              <div className={styles.title}>{v.title}</div>

              <div className={styles.statsRow}>
                <span className={styles.stat}>조회수 {fmtCount(views)}회</span>
                <span className={styles.dot}>•</span>
                <span className={styles.stat}>즐겨찾기 {fmtCount(favCnt)}</span>
              </div>

              <div className={styles.actions}>
                <button onClick={() => openDetail(v)} className={styles.btnSec}>상세보기</button>
                <button
                  onClick={() => toggleFav(v)}
                  className={`${styles.btn} ${isFav ? styles.favActive : ""}`}
                  title={isFav ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                >
                  {isFav ? "★ 즐겨찾기" : "☆ 즐겨찾기"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
