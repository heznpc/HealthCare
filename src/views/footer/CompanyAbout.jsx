// src/views/CompanyAbout.jsx
import React from "react";
import styles from "./css/CompanyAbout.module.css";

export default function CompanyAbout() {
  return (
    <div className={styles.wrap}>
      {/* Hero */}
      <section className={styles.hero}>
        <img src="/images/log.png" alt="HealthCare" className={styles.logo} />
        <h1 className={styles.title}>HealthCare</h1>
        <p className={styles.subtitle}>
          건강한 삶을 위한 스마트한 선택 — 식단·운동·체중을 한곳에서.
        </p>
      </section>

      {/* Mission */}
      <section className={styles.section}>
        <h2 className={styles.h2}>미션</h2>
        <p className={styles.lead}>
          누구나 쉽게 건강 데이터를 기록하고, <b>의미 있는 인사이트</b>를 얻어
          꾸준히 목표에 도달하도록 돕습니다.
        </p>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statNum}>3</div>
            <div className={styles.statLabel}>핵심 기능 (식단·운동·체중)</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNum}>AI</div>
            <div className={styles.statLabel}>맞춤 인사이트</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNum}>∞</div>
            <div className={styles.statLabel}>지속 가능한 루틴</div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className={styles.section}>
        <h2 className={styles.h2}>핵심 가치</h2>
        <ul className={styles.values}>
          <li><b>단순함</b> — 기록은 빠르게, 분석은 깊게.</li>
          <li><b>개인화</b> — 목표·상태에 맞춘 맞춤 피드백.</li>
          <li><b>연결</b> — 커뮤니티와 함께 하는 동기 부여.</li>
        </ul>
      </section>

      {/* Team */}
      <section className={styles.section}>
        <h2 className={styles.h2}>팀 소개</h2>
        <div className={styles.teamGrid}>
          <Member name="김광현" role="Frontend / ExercisePage" />
          <Member name="박선희" role="Frontend / DietPage" />
          <Member name="윤지연" role="Frontend / ExercisePage" />
          <Member name="김민중" role="Frontend / DietPage" />
          <Member name="임환목" role="Frontend / WeightPage" />
        </div>
      </section>

      {/* Roadmap */}
      <section className={styles.section}>
        <h2 className={styles.h2}>로드맵</h2>
        <div className={styles.timeline}>
          <div className={styles.ti}>
            <span className={styles.dot} />
            <div><b>2025 Q1</b> — MVP 출시, 기본 기록·분석 공개</div>
          </div>
          <div className={styles.ti}>
            <span className={styles.dot} />
            <div><b>2025 Q2</b> — AI 인사이트 고도화, 커뮤니티 기능</div>
          </div>
          <div className={styles.ti}>
            <span className={styles.dot} />
            <div><b>2025 Q3</b> — 웨어러블 연동, 목표 코칭</div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className={styles.section}>
        <h2 className={styles.h2}>문의</h2>
        <p className={styles.note}>
          제휴 및 채용 문의: <a href="mailto:hello@healthcare.local">hello@healthcare.local</a>
        </p>
      </section>
    </div>
  );
}

function Member({ name, role }) {
  return (
    <div className={styles.card}>
      <div className={styles.avatar} aria-hidden>
        {name.slice(-2)}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardName}>{name}</div>
        <div className={styles.cardRole}>{role}</div>
      </div>
    </div>
  );
}
