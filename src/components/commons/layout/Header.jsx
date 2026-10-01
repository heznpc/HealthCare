import { Link } from "react-router-dom";
import { useState } from "react";
import styles from "./css/Header.module.css";
import { useAuth } from "../../../auth/useAuth";

function Header() {
  const { isAuthenticated, logout } = useAuth();
  const [isDietDropdownOpen, setIsDietDropdownOpen] = useState(false);
  const [isExerciseDropdownOpen, setIsExerciseDropdownOpen] = useState(false);
  const [isWeightDropdownOpen, setIsWeightDropdownOpen] = useState(false);
  const [isCalendarDropdownOpen, setIsCalendarDropdownOpen] = useState(false);

  const handleLogoutClick = (e) => {
    e.preventDefault();
    logout();
  };

  return (
    <header className={`${styles.appHeader} ${styles.patternSprinkles}`}>
      {/* 로고 */}
      <h1 className={styles.logo}>
        <Link to="/">
          <img src="/images/log.png" alt="로고" className={styles.logoImg} />
          <span>HealthCare</span>
        </Link>
      </h1>

      {/* 인증 */}
      <ul className={styles.authRow}>
        {!isAuthenticated ? (
          <>
            <li><Link to="/login">로그인</Link></li>
            <li><Link to="/signup">회원가입</Link></li>
          </>
        ) : (
          <>
            <li><Link to="user/edit-profile">정보수정</Link></li>
            <li>
              <a href="#none" className={styles.logoutLink} onClick={handleLogoutClick}>
                로그아웃
              </a>
            </li>
          </>
        )}
      </ul>

      {/* 네비게이션 */}
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          <li><Link to="/dashboard">대시보드</Link></li>

          {/* 식단관리 */}
          <li
            className={styles.navItem}
            onMouseEnter={() => setIsDietDropdownOpen(true)}
            onMouseLeave={() => setIsDietDropdownOpen(false)}
          >
            <span className={styles.menuTitle}>식단관리</span>
            <ul className={`${styles.dropdown} ${isDietDropdownOpen ? styles.visible : ""}`}>
              <li><Link to="/diet/diet-record">식단 기록</Link></li>
              <li><Link to="/diet/calorie-analysis">칼로리 분석</Link></li>
              <li><Link to="/diet/recommendations">맞춤 추천</Link></li>
              <li><Link to="/diet/diet-share">식단 공유</Link></li>
            </ul>
          </li>

          {/* 운동관리 */}
          <li
            className={styles.navItem}
            onMouseEnter={() => setIsExerciseDropdownOpen(true)}
            onMouseLeave={() => setIsExerciseDropdownOpen(false)}
          >
            <span className={styles.menuTitle}>운동관리</span>
            <ul className={`${styles.dropdown} ${isExerciseDropdownOpen ? styles.visible : ""}`}>
              <li><Link to="/exercise/exercise-record">운동 기록</Link></li>
              <li><Link to="/exercise/healthmap">운동 시설</Link></li>
              <li><Link to="/exercise/home-training">홈트레이닝</Link></li>
            </ul>
          </li>

          {/* 체중관리 */}
          <li
            className={styles.navItem}
            onMouseEnter={() => setIsWeightDropdownOpen(true)}
            onMouseLeave={() => setIsWeightDropdownOpen(false)}
          >
            <span className={styles.menuTitle}>체중관리</span>
            <ul className={`${styles.dropdown} ${isWeightDropdownOpen ? styles.visible : ""}`}>
              <li><Link to="/weight/weight-record">체중 기록</Link></li>
              <li><Link to="/weight/weight-analysis">체중 분석</Link></li>
            </ul>
          </li>

          {/* 식운상세 */}
          <li
            className={styles.navItem}
            onMouseEnter={() => setIsCalendarDropdownOpen(true)}
            onMouseLeave={() => setIsCalendarDropdownOpen(false)}
          >
            <span className={styles.menuTitle}>식운상세</span>
            <ul className={`${styles.dropdown} ${isCalendarDropdownOpen ? styles.visible : ""}`}>
              <li><Link to="/calendar">캘린더</Link></li>
            </ul>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
