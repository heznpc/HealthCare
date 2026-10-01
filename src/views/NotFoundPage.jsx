import React from "react";
import { Link } from "react-router-dom";
import styles from "./css/NotFoundPage.module.css";

export default function NotFoundPage() {
  return (
    <section className={styles.wrap} aria-labelledby="nf-title">
      <div className={styles.card}>
        <div className={styles.emoji} aria-hidden>🔎</div>
        <h1 id="nf-title" className={styles.title}>404</h1>
        <p className={styles.sub}>페이지를 찾을 수 없습니다.</p>

        <div className={styles.hint}>
          • 주소가 맞는지 확인하세요<br/>
          • 이전 페이지로 돌아가거나 홈으로 이동하세요
        </div>

        <div className={styles.actions}>
          <button onClick={() => window.history.back()} className={styles.secondary}>이전으로</button>
          <Link to="/" className={styles.primary}>홈으로</Link>
        </div>
      </div>

      <footer className={styles.footer}>
        © {new Date().getFullYear()} HealthCare
      </footer>
    </section>
  );
}
