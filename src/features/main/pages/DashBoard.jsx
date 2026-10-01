// src/features/main/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { storage } from "utils/storage";

import GoalSetupWizard   from "features/diet/components/GoalSetupWizard";
import GoalCard          from "features/dashboard/components/GoalCard";
import TodaySummaryCard  from "features/dashboard/components/TodaySummaryCard";
import QuickAddCard      from "features/dashboard/components/QuickAddCard";
import AnalyticsPanel    from "features/dashboard/components/AnalyticsPanel";
import CommunityPanel    from "features/dashboard/components/CommunityPanel";
import GuestNotice from "components/commons/GuestNotice";
import WelcomeModal      from "features/dashboard/components/goal/WelcomeModal";
import CongratsGoalModal from "features/dashboard/components/goal/CongratsGoalModal";
import GoalViewDialog    from "features/dashboard/components/goal/GoalViewDialog";
import styles from "./Dashboard.module.css";

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isGuest, setIsGuest] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasGoal, setHasGoal] = useState(false);

  const [openGoal, setOpenGoal] = useState(false);
  const [openGoalView, setOpenGoalView] = useState(false);

  const [latestGoal, setLatestGoal] = useState(null);
  const [openCongrats, setOpenCongrats] = useState(false);

  const todayKey = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const readLatestGoalByKey = (uKey) => {
    const bucket = storage.get("userGoals");
    if (!bucket || typeof bucket !== "object" || Array.isArray(bucket)) return null;
    const arr = Array.isArray(bucket[uKey]) ? bucket[uKey] : [];
    return arr.length ? arr[arr.length - 1] : null;
  };

  const readuserGoals = (auth) => {
    if (!auth) return readLatestGoalByKey("guest");
    const uKey = auth.userKey || auth.id || auth.userId || auth.username || "guest";
    return readLatestGoalByKey(uKey);
  };

  useEffect(() => {
    const auth = storage.get("currentAuth");
    const qs = new URLSearchParams(location.search);

    // 외부 트리거: 쿼리 또는 스토리지 플래그로 위저드 열기
    const onceFlag = storage.get("openGoalOnce") === "1";
    if (qs.get("openGoal") === "1" || onceFlag) {
      setOpenGoal(true);
      if (onceFlag) storage.set("openGoalOnce", "0"); // 1회성 소모
      qs.delete("openGoal");
      navigate({ search: qs.toString() }, { replace: true });
    }

    if (!auth) {
      const guestGoal = readLatestGoalByKey("guest");

      setIsGuest(true);
      setLatestGoal(guestGoal);
      setHasGoal(!!guestGoal);
      setShowWelcome(false);
      return;
    }

    setIsGuest(false);

    const goal = readuserGoals(auth);
    setHasGoal(!!goal);
    setLatestGoal(goal);

    const newUserParam  = qs.get("newUser") === "true" || qs.get("newUser") === "1";
    const newUserState  = location.state?.justSignedUp === true;
    const authFlag      = !!auth.isNewUser;
    const dismissed     = storage.get("welcomeModalDismissed")?.dismissed === true;

    const shouldShow = (newUserParam || newUserState || authFlag) && !dismissed && !goal;
    setShowWelcome(shouldShow);
    if (shouldShow && newUserParam) {
      qs.delete("newUser");
      navigate({ search: qs.toString() }, { replace: true, state: {} });
    }

    const gc = storage.get("goalCongrats");
    if (gc?.show) {
      setOpenCongrats(true);
      storage.set("goalCongrats", { show: false, at: gc.at });
    }
  }, [location.search, location.state, navigate]);

  const clearNewUserFlag = () => {
    const ca = storage.get("currentAuth");
    if (ca?.isNewUser) storage.set("currentAuth", { ...ca, isNewUser: false });
  };

  const handleSaveGoal = (goal) => {
    setLatestGoal(goal);
    setHasGoal(true);
    setOpenGoal(false);
    storage.set("welcomeModalDismissed", { dismissed: true, at: goal.createdAt });
    setOpenCongrats(true);
    storage.set("goalCongrats", { show: false, at: goal.createdAt });
  };

  const handleWelcomeClose = () => {
    storage.set("welcomeModalDismissed", { dismissed: true, at: new Date().toISOString() });
    clearNewUserFlag();
    setShowWelcome(false);
  };

  const handleWelcomeContinue = () => {
    storage.set("welcomeModalDismissed", { dismissed: true, at: new Date().toISOString() });
    clearNewUserFlag();
    setShowWelcome(false);
    setOpenGoal(true);
  };

  const handleDeleteGoal = () => {
    const auth = storage.get("currentAuth");
    const uKey = auth?.userKey || auth?.id || auth?.username || "guest";

    const rawA = storage.get("userGoals");
    const rawB = storage.get("userGoal");

    const wipe = (obj) => {
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
      const n = { ...obj };
      if (n[uKey]) delete n[uKey];
      return n;
    };

    const nextA = wipe(rawA) ?? {};
    const nextB = wipe(rawB) ?? {};
    storage.set("userGoals", nextA);
    storage.set("userGoal", nextB);

    setLatestGoal(null);
    setHasGoal(false);
    setOpenGoalView(false);
  };

  return (
    <div className={styles.appWrap}>
      {isGuest && <GuestNotice />}

      {!isGuest && (
        <WelcomeModal
          open={showWelcome}
          onClose={handleWelcomeClose}
          onContinue={handleWelcomeContinue}
          isNewUser={showWelcome}
          hasGoal={hasGoal}
        />
      )}

      <section className={styles.topGrid}>
        <div className={styles.card}>
          <GoalCard
            latestGoal={latestGoal}
            onOpenGoal={() => setOpenGoal(true)}
            onOpenView={() => setOpenGoalView(true)}
          />
        </div>
        <div className={styles.card}><TodaySummaryCard /></div>
        <div className={styles.card}>
          <QuickAddCard
            onAddExercise={() => navigate("/exercise/exercise-record")}
            onAddWeight={() => { window.location.href = "/weight/weight-record"; }}
          />
        </div>
      </section>

      <section className={styles.bottomGrid}>
        <div className={styles.panel}><AnalyticsPanel /></div>
        <aside className={styles.panel}><CommunityPanel /></aside>
      </section>

      <GoalViewDialog
        open={openGoalView}
        goal={latestGoal}
        onClose={() => setOpenGoalView(false)}
        onEdit={() => {
          setOpenGoalView(false);
          setOpenGoal(true);
        }}
        onDelete={handleDeleteGoal}
      />

      <GoalSetupWizard
        open={openGoal}
        onClose={() => setOpenGoal(false)}
        onSave={handleSaveGoal}
        defaultProfile={
          latestGoal
            ? {
                gender: latestGoal.sex === "F" ? "female" : "male",
                age: latestGoal.age,
                heightCm: latestGoal.heightCm,
                weight: latestGoal.startWeight,
                userId: latestGoal.userId,
                userKey: latestGoal.userKey,
                username: latestGoal.username,
              }
            : undefined
        }
      />

      <CongratsGoalModal
        open={openCongrats}
        onClose={() => setOpenCongrats(false)}
        onStart={() => { setOpenCongrats(false); navigate("/diet/diet-record"); }}
      />
    </div>
  );
}

export default Dashboard;
