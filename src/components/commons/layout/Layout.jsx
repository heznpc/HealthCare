// src/layout/Layout.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import styles from "./css/Layout.module.css";
import AdminHeader from "../admin/header/AdminHeader";


function Layout({ children }) {
  const { pathname } = useLocation();

  const noLayoutPaths = ["/"];
  const isAdmin = pathname.startsWith("/admin"); // ✅ admin 경로 감지
  const HeaderComponent = isAdmin ? AdminHeader : Header; // ✅ 헤더 스위칭

  if (noLayoutPaths.includes(pathname)) {
    return <main className={styles.main}>{children}</main>;
  }

  return (
    <div className={styles.wrapContainer}>
      <HeaderComponent /> {/* ✅ 경로에 따라 헤더 교체 */}
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}

export default Layout;
