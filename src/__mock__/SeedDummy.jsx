import { localData } from "../utils/indexedStore.mjs";
// src/data/seedDummy.jsx
import DummyUsers from "./DummyUsers"; // 100명 배열 export default

(function seed() {
  try {
    const raw = localData.getItem("users");
    if (!raw) {
      localData.setItem("users", JSON.stringify(DummyUsers));
      // console.log("✅ 더미 유저 100명 세팅");
    }
  } catch (e) {
    console.error("seedDummy error:", e);
  }
})();
