// src/components/GoalPromptProvider.jsx
import { createContext, useCallback, useContext, useState } from "react";
import GoalPromptToast from "./GoalPromptToast.jsx";
import { storage } from "utils/storage";

const Ctx = createContext(null);

export function GoalPromptProvider({ children }) {
  const [state, setState] = useState({ open: false, opts: {} });

  const open = useCallback((opts = {}) => {
    // 1회성 플래그가 이미 있으면 열지 않음
    if (storage.get("openGoalOnce") === "1") return;
    setState({ open: true, opts });
  }, []);

  const close = useCallback(() => {
    setState({ open: false, opts: {} });
  }, []);

  const handleConfirm = useCallback(async () => {
    const cb = state.opts?.onConfirm;
    close();
    if (typeof cb === "function") {
      cb();
    } else {
      // 기본 동작: 대시보드에서 GoalSetupWizard 열기
      storage.set("openGoalOnce", "1");          // 1회성 플래그 설정
      try { await storage.flush(); } catch { return; }
      window.location.href = "/dashboard";       // 필요시 "/"로 변경
    }
  }, [state.opts, close]);

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      {state.open && storage.get("openGoalOnce") !== "1" && (
        <GoalPromptToast
          open={true}
          title={state.opts?.title ?? "목표 설정부터 먼저 진행하세요"}
          message={state.opts?.message ?? "체중 기록을 의미 있게 보려면 목표 체중을 먼저 설정하세요."}
          confirmText={state.opts?.confirmText ?? "목표 설정하기"}
          cancelText={state.opts?.cancelText ?? "닫기"}
          onClose={close}
          onConfirm={handleConfirm}
        />
      )}
    </Ctx.Provider>
  );
}

export function useGoalPrompt() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGoalPrompt must be used within GoalPromptProvider");
  return ctx;
}
