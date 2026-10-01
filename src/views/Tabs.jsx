import { useState } from 'react';
import "./css/Tabs.css";

function Tabs({ tabs = [], children, defaultIndex = 0 }) {
  const [idx, setIdx] = useState(defaultIndex);
  const views = Array.isArray(children) ? children : [children];

  return (
    <div className="tabs">
      <div className="tabList">
        {tabs.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setIdx(i)}
            className={`tab ${i === idx ? 'active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="panel">{views[idx]}</div>
    </div>
  );
}

export default Tabs;

