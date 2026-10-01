// src/features/popup/GoalPromptGuard.jsx
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { storage } from "../../utils/storage";
import { useGoalPrompt } from "./GoalPromptProvider.jsx";

/** 경로 정규화: 끝 슬래시 제거, 빈 값은 "/" */
const norm = (p = "/") => {
  if (p === "/") return "/";
  const n = String(p).replace(/\/+$/, "");
  return n || "/";
};

/** 제외 규칙 매칭
 * - "/"            → 루트만 제외
 * - "/foo"         → 정확히 "/foo"만 제외
 * - "/foo/*"       → "/foo"와 그 하위 경로 제외
 */
function matchesExclude(pathname, rules = []) {
  const path = norm(pathname);
  return rules.some((rule) => {
    if (!rule) return false;
    if (rule === "/") return path === "/";
    if (rule.endsWith("/*")) {
      const base = norm(rule.slice(0, -2));
      return path === base || path.startsWith(base + "/");
    }
    return path === norm(rule);
  });
}

/** 모든 라우트에서 목표 미설정 시 토스트 오픈 */
export default function GoalPromptGuard({ exclude = [] }) {
  const { pathname } = useLocation();
  const { open } = useGoalPrompt();

  const firedRef = useRef(false);
  const lastPathRef = useRef("");

  useEffect(() => {
    // 경로 변경 시 1회 플래그 초기화
    if (lastPathRef.current !== pathname) {
      firedRef.current = false;
      lastPathRef.current = pathname;
    }

    // 제외 경로면 스킵
    if (matchesExclude(pathname, exclude)) return;

    // 목표 존재 여부 확인
    const userKey = storage.get("currentAuth")?.userKey;
    if (!userKey) return;
    const goals = storage.get("userGoals");
    let latest = null;
    if (goals && typeof goals === "object" && !Array.isArray(goals)) {
      const arr = Array.isArray(goals[userKey]) ? goals[userKey] : [];
      latest = arr.length ? arr[arr.length - 1] : null;
    }
    const hasGoal = Number(latest?.goalWeight) > 0;

    if (!hasGoal && !firedRef.current) {
      firedRef.current = true;
      // 레이아웃 마운트 후 다음 틱에 오픈
      setTimeout(() => {
        open({
          title: "목표 설정부터 먼저 진행하세요",
          message: "체중·식단·운동 기록을 의미 있게 보려면 목표 체중을 먼저 설정하세요.",
          confirmText: "목표 설정하기",
          cancelText: "닫기",
        });
      }, 0);
    }
  }, [pathname, exclude, open]);

  return null;
}
