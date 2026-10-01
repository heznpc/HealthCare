import { showAlert } from '../../../utils/dialogs';
import React, { useState, useMemo } from "react";
import { useAuth } from "../../../auth/useAuth";
import { storage } from "../../../utils/storage";
import { USER_ROLES } from "../../../utils/constants";
import styles from "./css/CommunityPanel.module.css";

const PAGE_SIZE = 10;
const fmtLocal = (d) => {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function CommunityPanel() {
  const { user, isAuthenticated } = useAuth();
  const [entries, setEntries] = useState(storage.get("guestbook") || []);
  const [comment, setComment] = useState("");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});

  const blocked = !isAuthenticated || user?.role === USER_ROLES.GUEST;
  const uid = user?.userKey || user?.id || null;

  // 선택된 사용자의 방명록 엔트리 필터링
  const selectedUserEntries = useMemo(() => {
    if (!selectedUser) return [];
    // entries가 배열인지 확인하여 오류 방지
    return Array.isArray(entries)
      ? entries.filter(
          (entry) =>
            entry.userKey === selectedUser.userKey || entry.userId === selectedUser.id
        )
      : [];
  }, [entries, selectedUser]);

  // 현재 로그인한 사용자의 방명록만 초기 표시
  const currentUserEntries = useMemo(() => {
    // entries가 배열인지 확인하여 오류 방지
    return Array.isArray(entries)
      ? entries.filter(
          (entry) => entry.userKey === uid || entry.userId === user?.id
        )
      : [];
  }, [entries, uid, user?.id]);

  const totalPages =
    Math.ceil(
      (selectedUser ? selectedUserEntries : currentUserEntries).length / PAGE_SIZE
    ) || 1;

  const current = useMemo(() => {
    const targetEntries = selectedUser ? selectedUserEntries : currentUserEntries;
    const start = (page - 1) * PAGE_SIZE;
    return targetEntries.slice(start, start + PAGE_SIZE);
  }, [selectedUser, selectedUserEntries, currentUserEntries, page]);

  // 닉네임 검색
  const searchUser = () => {
    if (!searchQuery.trim()) {
      showAlert("검색할 닉네임을 입력해주세요.");
      return;
    }

    const users = storage.getAllUsers();
    const foundUser = users.find(
      (u) => u.profile?.nickname === searchQuery.trim() && !u.auth?.isDeleted
    );

    if (foundUser) {
      setSearchResult(foundUser);
      setSelectedUser(foundUser);
    } else {
      setSearchResult(null);
      setSelectedUser(null);
      showAlert("해당 닉네임을 가진 사용자를 찾을 수 없습니다.");
    }
  };

  // 방명록에 댓글 추가
  const handleAddComment = (entryId) => {
    if (blocked) {
      showAlert("게스트는 댓글을 남길 수 없습니다.");
      return;
    }

    const text = (replyTexts[entryId] || "").trim();
    if (!text) {
      showAlert("댓글 내용을 입력해주세요.");
      return;
    }

    const updatedEntries = entries.map((entry) => {
      if (entry.id === entryId) {
        const newComment = {
          id: Date.now(),
          userKey: uid,
          userId: user?.id,
          nickname: user?.profile?.nickname || user?.username || user?.id || "익명",
          text,
          createdAt: new Date().toISOString(),
        };

        return {
          ...entry,
          comments: [...(entry.comments || []), newComment],
        };
      }
      return entry;
    });

    setEntries(updatedEntries);
    storage.set("guestbook", updatedEntries);
    setReplyTexts((prev) => ({ ...prev, [entryId]: "" }));
  };

  // 새 방명록 추가
  const handleAdd = () => {
    if (blocked) {
      showAlert("게스트는 방명록을 남길 수 없습니다.");
      return;
    }
    const text = comment.trim();
    if (!text) return;

    // 하루 1회 제한
    const today = fmtLocal(new Date());
    const alreadyToday = entries.some(
      (e) => (e.userKey || e.userId) === uid && fmtLocal(new Date(e.createdAt)) === today
    );
    if (alreadyToday) {
      showAlert("하루에 한 번만 방명록을 남길 수 있습니다.");
      return;
    }

    const newEntry = {
      id: Date.now(),
      userKey: uid,
      userId: user?.id,
      nickname: user?.profile?.nickname || user?.username || user?.id || "익명",
      text,
      createdAt: new Date().toISOString(),
      comments: [],
    };

    const next = [newEntry, ...entries];
    setEntries(next);
    storage.set("guestbook", next);
    setComment("");
    setPage(1);
  };

  const clearSearch = () => {
    setSelectedUser(null);
    setSearchResult(null);
    setSearchQuery("");
  };

  if (blocked) {
    return (
      <aside className={styles.panel}>
        <h3 className={styles.title}>🗣 방명록</h3>
        <div className={styles.guestMessage}>
          <p className={styles.muted}>로그인한 회원만 방명록을 이용할 수 있습니다.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>📝 방명록</h3>
        <div className={styles.searchMini}>
          <input
            type="text"
            value={searchQuery}
            placeholder="닉네임 검색"
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            onKeyPress={(e) => e.key === "Enter" && searchUser()}
          />
          <button onClick={searchUser} className={styles.searchBtnMini}>
            찾기
          </button>
        </div>
      </div>

      {searchResult && (
        <div className={styles.searchResult}>
          <span className={styles.foundUser}>
            💝 <strong>{searchResult.profile?.nickname || searchResult.username}</strong>
            님의 방명록
          </span>
          <button onClick={clearSearch} className={styles.clearBtn}>
            내 방명록
          </button>
        </div>
      )}

      <div className={styles.contentArea}>
        <div className={styles.guestbookList}>
          {current.map((e) => (
            <div key={e.id} className={styles.guestbookItem}>
              <div className={styles.itemHeader}>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>{e.nickname}</span>
                  <span className={styles.dateInfo}>{fmtLocal(e.createdAt)}</span>
                </div>
              </div>
              <div className={styles.messageContent}>{e.text}</div>

              {e.comments && e.comments.length > 0 && (
                <div className={styles.commentsSection}>
                  <div className={styles.commentsHeader}>💬 댓글 {e.comments.length}개</div>
                  <div className={styles.commentsList}>
                    {e.comments.map((comment) => (
                      <div key={comment.id} className={styles.commentItem}>
                        <span className={styles.commentAuthor}>{comment.nickname}</span>
                        <span className={styles.commentText}>{comment.text}</span>
                        <span className={styles.commentDate}>{fmtLocal(comment.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.replySection}>
                <input
                  type="text"
                  value={replyTexts[e.id] || ""}
                  placeholder="댓글을 남겨주세요..."
                  onChange={(ev) =>
                    setReplyTexts((prev) => ({ ...prev, [e.id]: ev.target.value }))
                  }
                  className={styles.replyInput}
                  maxLength={200}
                />
                <button
                  onClick={() => handleAddComment(e.id)}
                  className={styles.replyBtn}
                  disabled={!(replyTexts[e.id] || "").trim()}
                >
                  💌
                </button>
              </div>
            </div>
          ))}

          {current.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📝</div>
              <div className={styles.emptyText}>
                {selectedUser
                  ? `${searchResult?.profile?.nickname || searchResult?.username}님의 방명록이 아직 없어요`
                  : "아직 방명록이 없어요"}
              </div>
              <div className={styles.emptySubText}>첫 번째 방명록을 남겨보세요! ✨</div>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`${styles.pageBtn} ${page === i + 1 ? styles.pageActive : ""}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        <div className={styles.writeSection}>
          <div className={styles.writeHeader}>✏️ 새 방명록 작성하기</div>
          <div className={styles.writeBox}>
            <input
              type="text"
              value={comment}
              placeholder="따뜻한 메시지를 남겨주세요..."
              onChange={(e) => setComment(e.target.value)}
              className={styles.writeInput}
              maxLength={200}
            />
            <button onClick={handleAdd} className={styles.writeBtn}>
              💝 등록
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}