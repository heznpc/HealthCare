import styles from "../../css/DietDashboard.module.css";
import { useEffect, useState } from "react";

function KpiProgressCard({
  label,
  values = 0,
  goal = 0,
  unit = "kcal",
  okRange = 10,
}) {
  const pct = goal > 0 ? Math.round((values / goal) * 100) : 0;
  const targetWidth = `${Math.min(100, Math.max(0, pct))}%`;
  const status = !goal
    ? "none"
    : pct < 100 - okRange
    ? "low"
    : pct <= 100 + okRange
    ? "ok"
    : "high";

  const [w, setW] = useState("0%");
  useEffect(() => {
    const id = requestAnimationFrame(() => setW(targetWidth));
    return () => cancelAnimationFrame(id);
  }, [targetWidth]);

  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiTitle}>{label}</div>

      <div className={styles.kpiMain}>
        <strong className={styles.kpiStrong}>{values.toLocaleString()}</strong>
        <span className={styles.kpiSub}> / {goal.toLocaleString()} {unit}</span>
      </div>

      <div
        className={styles.kpiBar}
        aria-valuemin={0}
        aria-valuemax={goal || 0}
        aria-valuenow={Math.min(values, goal || 0)}
        aria-label={`${label} 진행률`}
      >
        <span className={styles.kpiFill} style={{ width: w }} />
      </div>

      <div className={styles.kpiFoot}>
        <span className={styles.kpiPercent}>{pct}% 달성</span>
        <span className={styles[`kpi${status}`]}>
          {status === "ok"
            ? "우수"
            : status === "low"
            ? "부족"
            : status === "high"
            ? "과다"
            : ""}
        </span>
      </div>
    </div>
  );
}

export default KpiProgressCard;

