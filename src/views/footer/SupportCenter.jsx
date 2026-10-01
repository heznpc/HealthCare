import { showAlert } from '../../utils/dialogs';
// src/components/support/SupportCenter.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./css/SupportCenter.module.css";

export default function SupportCenter() {
  const [q, setQ] = useState("");

  const onSearch = (e) => {
    e.preventDefault();
    showAlert(`검색: ${q}`);
  };

  return (
    <div className={styles.wrap}>
      {/* Hero */}
      <section className={`${styles.hero} ${styles.patternChevrons}`}>
        <div className={styles.heroInner}>
          <h1 className={styles.title}>고객 지원 센터</h1>
          <p className={styles.subtitle}>건강 관리 여정을 돕는 안내와 도움말</p>

          <form className={styles.search} onSubmit={onSearch}>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="예) 칼로리 계산 방법, 체중 기록 수정"
              aria-label="도움말 검색"
              className={styles.searchInput}
            />
            <button className={styles.searchBtn} type="submit">검색</button>
          </form>

          <div className={styles.quickRow}>
            <Link to="#notice" className={styles.quickCard}>
              <span className={styles.quickIcon}>📢</span>
              <div>
                <div className={styles.quickTitle}>공지사항</div>
                <div className={styles.quickDesc}>업데이트와 변경 사항</div>
              </div>
            </Link>
            <a href="#faq" className={styles.quickCard}>
              <span className={styles.quickIcon}>❓</span>
              <div>
                <div className={styles.quickTitle}>FAQ</div>
                <div className={styles.quickDesc}>자주 묻는 질문</div>
              </div>
            </a>
            <a href="#contact" className={styles.quickCard}>
              <span className={styles.quickIcon}>💬</span>
              <div>
                <div className={styles.quickTitle}>문의하기</div>
                <div className={styles.quickDesc}>이메일·메신저 상담</div>
              </div>
            </a>
            <a href="#status" className={styles.quickCard}>
              <span className={styles.quickIcon}>🟢</span>
              <div>
                <div className={styles.quickTitle}>서비스 상태</div>
                <div className={styles.quickDesc}>정상 운영 중</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* 도움말 카테고리 */}
      <section className={styles.section} id="guide">
        <h2 className={styles.sectionTitle}>빠른 도움말</h2>
        <div className={styles.grid4}>
          <div className={styles.card}>
            <h3>계정</h3>
            <ul className={styles.linkList}>
              <li><Link to="#">로그인/로그아웃</Link></li>
              <li><Link to="#">프로필 수정</Link></li>
              <li><Link to="#">데이터 내보내기</Link></li>
            </ul>
          </div>
          <div className={styles.card}>
            <h3>식단</h3>
            <ul className={styles.linkList}>
              <li><Link to="#">식단 기록 추가/수정</Link></li>
              <li><Link to="#">영양소 자동 계산</Link></li>
              <li><Link to="#">맞춤 추천 사용법</Link></li>
            </ul>
          </div>
          <div className={styles.card}>
            <h3>운동</h3>
            <ul className={styles.linkList}>
              <li><Link to="#">운동 기록</Link></li>
              <li><Link to="#">소모 칼로리 입력</Link></li>
              <li><Link to="#">운동 캘린더</Link></li>
            </ul>
          </div>
          <div className={styles.card}>
            <h3>체중</h3>
            <ul className={styles.linkList}>
              <li><Link to="#">체중 기록</Link></li>
              <li><Link to="#">일/주/월 차트</Link></li>
              <li><Link to="#">목표 설정</Link></li>
            </ul>
          </div>
        </div>
      </section>

      {/* 공지 */}
      <section className={styles.section} id="notice">
        <div className={styles.rowBetween}>
          <h2 className={styles.sectionTitle}>공지사항</h2>
          <span className={styles.badgeInfo}>업데이트</span>
        </div>
        <ul className={styles.noticeList}>
          <li><span className={styles.noticeDot} /> 2025-08-20 식단 추천 모델 개선</li>
          <li><span className={styles.noticeDot} /> 2025-08-12 체중 차트 성능 향상</li>
          <li><span className={styles.noticeDot} /> 2025-08-05 보안 패치 적용</li>
        </ul>
      </section>

      {/* FAQ */}
      <section className={styles.section} id="faq">
        <h2 className={styles.sectionTitle}>자주 묻는 질문</h2>
        <div className={styles.faq}>
          <details>
            <summary>게스트 모드에서는 체중 기록이 몇 개까지 가능한가요?</summary>
            <p>게스트는 10개까지만 새 날짜 추가가 가능합니다. 기존 날짜 수정은 가능.</p>
          </details>
          <details>
            <summary>목표 체중을 바꾸면 차트가 즉시 반영되나요?</summary>
            <p>목표 저장 후 대시보드와 캘린더에 즉시 반영됩니다.</p>
          </details>
          <details>
            <summary>식단의 영양소는 어떻게 계산하나요?</summary>
            <p>기본 DB와 사용자가 입력한 항목을 합산해 일일 섭취량을 계산합니다.</p>
          </details>
        </div>
      </section>

      {/* 연락처 */}
      <section className={styles.section} id="contact">
        <div className={styles.rowBetween}>
          <h2 className={styles.sectionTitle}>연락하기</h2>
          <span id="status" className={styles.badgeOk}>서비스 정상</span>
        </div>
        <div className={styles.grid3}>
          <div className={styles.card}>
            <div className={styles.contactIcon}>📧</div>
            <div className={styles.contactTitle}>이메일</div>
            <p className={styles.contactDesc}>문의 내용, 스크린샷을 함께 보내주세요.</p>
            <a className={styles.btnGhost} href="mailto:support@minjung.kr">support@minjung.kr</a>
          </div>
          <div className={styles.card}>
            <div className={styles.contactIcon}>💬</div>
            <div className={styles.contactTitle}>메신저</div>
            <p className={styles.contactDesc}>실시간 간단 문의에 응답합니다.</p>
            <a className={styles.btnGhost} href="#">오픈채팅 바로가기</a>
          </div>
          <div className={styles.card}>
            <div className={styles.contactIcon}>⏱️</div>
            <div className={styles.contactTitle}>운영 시간</div>
            <p className={styles.contactDesc}>평일 10:00–18:00 (KST)</p>
            <span className={styles.badgeInfo}>점심 12:30–13:30</span>
          </div>
        </div>
      </section>
    </div>
  );
}
