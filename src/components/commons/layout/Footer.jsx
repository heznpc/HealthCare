import { Link } from "react-router-dom";
import styles from "./css/Footer.module.css";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <img src="/images/log.png" alt="HealthCare" className={styles.logo} />
            <div>
              <div className={styles.brandName}>HealthCare</div>
              <p className={styles.tagline}>건강한 삶을 위한 스마트한 선택</p>
            </div>
          </div>

          <div className={styles.col}>
            <h4>제품</h4>
            <ul>
              <li><Link to="/diet/diet-record">식단 관리</Link></li>
              <li><Link to="/exercise/exercise-record">운동 트래킹</Link></li>
              <li><Link to="/weight/weight-analysis">체중 분석</Link></li>
              <li><Link to="/dashboard">AI 인사이트</Link></li>
            </ul>
          </div>

          <div className={styles.col}>
            <h4>회사</h4>
            <ul>
              <li><Link to="/footer/companyabout">회사 소개</Link></li>
            </ul>
          </div>

          <div className={styles.col}>
            <h4>지원</h4>
            <ul>
              <li><Link to="/footer/support">고객 지원</Link></li>
              <li><Link to="/footer/terms">이용 약관</Link></li>
              <li><Link to="/footer/privarypolicy">개인정보 보호</Link></li>
              <li><Link to="/footer/FAQ">FAQ</Link></li>
            </ul>
          </div>
        </div>

        <hr className={styles.divider} />

        <div className={styles.bottom}>
          <p>© {year} HealthCare. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
