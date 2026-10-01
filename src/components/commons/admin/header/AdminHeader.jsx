import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import styles from "./css/AdminHeader.module.css";
import { useAuth } from "auth/useAuth";


function AdminHeader() {
  const { isAuthenticated, logout } = useAuth();
  const [dietOpen, setDietOpen] = useState(false);
  const [exOpen, setExOpen] = useState(false);
  const [gxOpen, setGxOpen] = useState(false);
  const [wtOpen, setWtOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const navigate = useNavigate();

  const onLogout = (e) => {
    e.preventDefault();
    logout();
    // 히스토리 클리어하고 메인 페이지로 이동
    window.history.replaceState(null, null, "/");
    navigate("/", { replace: true });
  };

  return (
    <header className={`${styles.appHeader} ${styles.patternSprinkles}`}>
      <h1 className={styles.logo}>
        <Link to={isAuthenticated ? "/admin/dashboard" : "/"}>
          <img src="/images/log.png" alt="" className={styles.logoImg} />
          <span>HealthCare Admin</span>
        </Link>
      </h1>

      <ul className={styles.authRow}>
        {isAuthenticated ? (
          <>
            <li><Link to="/admin/edit-profile">정보수정</Link></li>
            <li>
              <Link to="/" className={styles.logoutLink} onClick={onLogout}>
                로그아웃
              </Link>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/">로그인</Link></li>
            <li><Link to="/signup">회원가입</Link></li>
          </>
        )}
      </ul>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {!isAuthenticated ? (
            <>
            </>
          ) : (
            <>
              <li ><Link to="/admin/dashboard">대시보드</Link></li>
            </>
          )}

          {isAuthenticated && (
            <>
              <li
                className={styles.navItem}
                onMouseEnter={() => setDietOpen(true)}
                onMouseLeave={() => setDietOpen(false)}
              >
                <span className={styles.menuTitle}>식단관리</span>
                <ul className={`${styles.dropdown} ${dietOpen ? styles.visible : ""}`}>
                  <li><Link to="/admin/diet-manager">식단 매니저</Link></li>
                  <li><Link to="/admin/diet-analysis">식단 분석</Link></li>
                </ul>
              </li>

              <li
                className={styles.navItem}
                onMouseEnter={() => setExOpen(true)}
                onMouseLeave={() => setExOpen(false)}
              >
                <span className={styles.menuTitle}>운동관리</span>
                <ul className={`${styles.dropdown} ${exOpen ? styles.visible : ""}`}>
                  <li><Link to="/admin/exercise-manager">운동 매니저</Link></li>
                  <li><Link to="/admin/hometraining-manager">홈트레이닝 매니저</Link></li>
                </ul>
              </li>

              <li
                className={styles.navItem}
                onMouseEnter={() => setWtOpen(true)}
                onMouseLeave={() => setWtOpen(false)}
              >
                <span className={styles.menuTitle}>체중관리</span>
                <ul className={`${styles.dropdown} ${wtOpen ? styles.visible : ""}`}>
                  <li><Link to="/admin/weight-manager">체중 매니저</Link></li>
                </ul>
              </li>

              <li
                className={styles.navItem}
                onMouseEnter={() => setGxOpen(true)}
                onMouseLeave={() => setGxOpen(false)}
              >
                <span className={styles.menuTitle}>게스트관리</span>
                <ul className={`${styles.dropdown} ${gxOpen ? styles.visible : ""}`}>
                  <li><Link to="/admin/guest-manager">게스트 매니저</Link></li>
                </ul>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default AdminHeader;
