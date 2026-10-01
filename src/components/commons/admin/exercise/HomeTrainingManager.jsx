import { useState, useEffect, useMemo } from "react";
import styles from "./css/HomeTrainingManager.module.css";
import { storage } from "utils/storage";

const KEY = "AIzaSyDZXd321QOR2tWqZa1HD6ieFlxLNSjsGDQ"; // YouTube API key

const LS_RECS = "homeTraining::recsV1";

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

const urlForVideo = (idOrCsv) => {
  const u = new URL("https://www.googleapis.com/youtube/v3/videos");
  u.search = new URLSearchParams({ key: KEY, part: "snippet", id: idOrCsv }).toString();
  return u.toString();
};

export default function HomeTrainingManager({ isAdmin }) {
  // Hook은 조건 없이 최상단에서 호출
  const [recs, setRecs] = useState(() => {
    const saved = storage.get(LS_RECS);
    return saved && typeof saved === "object" ? saved : { ids: [], items: {} };
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const recList = useMemo(() => {
    return recs.ids
      .map((id) => {
        const item = recs.items[id];
        return {
          id,
          title: item?.title || "(제목 없음)",
          thumb: thumbFromId(id),
          url: item?.url || `https://www.youtube.com/watch?v=${id}`,
        };
      })
      .filter((v) => !!v.id);
  }, [recs]);

  const addVideo = async () => {
    setError("");
    const id = toYouTubeId(input);
    if (!id) {
      setError("유효한 유튜브 영상 ID 또는 URL을 입력하세요.");
      return;
    }
    if (recs.ids.includes(id)) {
      setError("이미 추천 목록에 존재하는 영상입니다.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(urlForVideo(id));
      const data = await res.json();
      const snippet = data?.items?.[0]?.snippet;
      const title = snippet?.title || "(제목 없음)";
      const newIds = [...recs.ids, id];
      const newItems = { ...recs.items, [id]: { title, url: `https://www.youtube.com/watch?v=${id}`, regdate: new Date().toISOString() } };
      const next = { ids: newIds, items: newItems };
      setRecs(next);
      storage.set(LS_RECS, next);
      setInput("");
    } catch (e) {
      setError("영상 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const removeVideo = (id) => {
    const newIds = recs.ids.filter((x) => x !== id);
    const newItems = { ...recs.items };
    delete newItems[id];
    const next = { ids: newIds, items: newItems };
    setRecs(next);
    storage.set(LS_RECS, next);
  };

  // 접근 권한 체크 - 렌더링 시점에 처리
  if (!isAdmin) {
    return <p>접근 권한이 없습니다.</p>;
  }

  return (
    <div className={styles.wrap}>
      <h1>추천 영상 관리</h1>

      <div className={styles.searchForm} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="유튜브 영상 ID 또는 URL 입력"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={styles.input}
          disabled={loading}
        />
        <button onClick={addVideo} className={styles.btn} disabled={loading || !input.trim()}>
          {loading ? "추가 중..." : "추천 영상 추가"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {recList.length === 0 ? (
        <p>추천 영상이 없습니다.</p>
      ) : (
        <div className={styles.grid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
          {recList.map(({ id, title, thumb }) => (
            <div key={id} className={styles.card} style={{ position: "relative" }}>
              <div className={styles.thumbWrap}>
                <img src={thumb} alt={title} className={styles.thumbImg} loading="lazy" />
              </div>
              <div className={styles.title} title={title}>
                {title}
              </div>
              <button
                onClick={() => removeVideo(id)}
                className={styles.btnSmall}
                style={{ position: "absolute", top: 5, right: 5 }}
                title="삭제"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
