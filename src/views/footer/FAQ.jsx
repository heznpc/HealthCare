import React, { useMemo, useState } from "react";
import styles from "./css/FAQ.module.css";

const FAQ_DATA = [
  { cat: "계정", q: "게스트와 회원 차이가 뭔가요?", a: "게스트는 기기당 임시 저장이고, 즐겨찾기는 5개 제한이 있습니다. 회원은 여러 기기 동기화와 즐겨찾기 제한이 없습니다." },
  { cat: "계정", q: "비밀번호를 잊었어요.", a: "로그인 화면의 ‘비밀번호 찾기’를 눌러 힌트/이메일 인증 절차를 진행해주세요." },
  { cat: "식단", q: "영양소는 어떻게 계산되나요?", a: "입력한 식품의 영양 정보를 1회분 기준으로 합산하며, 수량(그램·개수)에 따라 자동 환산합니다." },
  { cat: "식단", q: "식단 항목을 직접 추가할 수 있나요?", a: "예. ‘직접 추가’에서 이름·중량·영양소를 입력해 나만의 식품을 등록할 수 있습니다." },
  { cat: "운동", q: "홈트레이닝 영상 조회수는 유튜브 값인가요?", a: "아니요. 앱 내에서 별도로 카운팅합니다. 상세보기 진입 시 1회 증가합니다." },
  { cat: "운동", q: "즐겨찾기는 몇 개까지 가능한가요?", a: "게스트 5개, 회원은 제한 없습니다." },
  { cat: "체중", q: "목표 체중을 바꾸면 차트에 바로 반영되나요?", a: "예. 목표 저장 즉시 대시보드·캘린더·차트에 적용됩니다." },
  { cat: "체중", q: "체중 기록은 하루에 몇 번까지 가능한가요?", a: "날짜별 여러 건 입력 가능하나, 통계는 가장 최근 기록을 기준으로 집계됩니다." },
  { cat: "기타", q: "데이터를 내보내고 싶어요.", a: "설정 > 데이터 관리에서 CSV로 내보내기 할 수 있습니다." },
  { cat: "기타", q: "문의는 어디로 하나요?", a: "support@healthcare.local 로 메일 주세요. 평일 10:00–18:00 응대합니다." },
];

const CATS = ["전체", "계정", "식단", "운동", "체중", "기타"];

export default function FAQ() {
  const [cat, setCat] = useState("전체");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return FAQ_DATA.filter(item => {
      const inCat = cat === "전체" || item.cat === cat;
      const inKw = !kw || (item.q + item.a).toLowerCase().includes(kw);
      return inCat && inKw;
    });
  }, [cat, q]);

  return (
    <div className={styles.wrap}>
      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.title}>자주 묻는 질문(FAQ)</h1>
        <p className={styles.subtitle}>찾으시는 답이 없다면 아래 문의로 연락주세요.</p>

        <form
          className={styles.searchRow}
          onSubmit={e => { e.preventDefault(); }}
          role="search"
          aria-label="FAQ 검색"
        >
          <input
            className={styles.searchInput}
            type="search"
            placeholder="예) 비밀번호, 즐겨찾기, 목표 체중…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button className={styles.searchBtn} type="submit">검색</button>
        </form>

        <div className={styles.chips} role="tablist" aria-label="카테고리">
          {CATS.map(c => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={cat === c}
              className={`${styles.chip} ${cat === c ? styles.chipActive : ""}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* FAQ List */}
      <section className={styles.section}>
        <h2 className={styles.h2}>도움말</h2>

        {list.length === 0 ? (
          <p className={styles.empty}>검색 결과가 없습니다. 키워드를 바꿔보세요.</p>
        ) : (
          <div className={styles.faqList}>
            {list.map((item, i) => (
              <details key={`${item.q}-${i}`} className={styles.item}>
                <summary className={styles.summary}>
                  <span className={styles.badge}>{item.cat}</span>
                  {item.q}
                </summary>
                <div className={styles.answer}>{item.a}</div>
              </details>
            ))}
          </div>
        )}
      </section>

      {/* Contact */}
      <section className={styles.section}>
        <h2 className={styles.h2}>더 도움이 필요하세요?</h2>
        <div className={styles.contactCard}>
          <div className={styles.contactText}>
            평일 10:00–18:00 (점심 12:30–13:30) / 보통 24시간 내 회신
          </div>
          <a className={styles.btnPrimary} href="mailto:support@healthcare.local">
            이메일 문의하기
          </a>
        </div>
      </section>
    </div>
  );
}
