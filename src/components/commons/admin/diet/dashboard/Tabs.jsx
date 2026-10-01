import { useState } from "react";
import styles from "../css/Tabs.module.css";

function Tabs({ tabs = [], children, defaultIndex = 0 }) {
  const [idx, setIdx] = useState(defaultIndex);
  const views = Array.isArray(children) ? children : [children];

  return (
    <div className={styles.tabs}>
      <div className={styles.tabList}>
        {tabs.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setIdx(i)}
            className={`${styles.tab} ${i === idx ? styles.active : ""}`}
            aria-selected={i === idx}
            role="tab"
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.panel} role="tabpanel">
        {views[idx]}
      </div>
    </div>
  );
}

export default Tabs;


