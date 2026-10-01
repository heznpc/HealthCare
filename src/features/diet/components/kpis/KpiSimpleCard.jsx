import styles from "../../css/DietDashboard.module.css";

function KpiSimpleCard({
  label,
  value = 0,
  unit = "",
  subtitle = ""
}) {
  
  return (
    <div className={styles.kpiSimpleCard}>
      <div className={styles.kpiTitle}>{label}</div>

      <div className={styles.kpiSimpleMain}>
        <strong className={styles.kpiStrong}>{value.toLocaleString()}</strong>
        {unit && <span className={styles.kpiSub}> {unit}</span>}
      </div>

      {subtitle && (
        <div className={styles.kpiFoot}>
          <span className={styles.kpiSubtitle}>{subtitle}</span>
        </div>
      )}
    </div>
  );
}

export default KpiSimpleCard;