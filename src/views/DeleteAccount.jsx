import { showAlert } from '../utils/dialogs';
// src/features/account/views/DeleteAccount.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "auth/useAuth";
import { storage } from "utils/storage";
import styles from "./css/DeleteAccount.module.css";

export default function DeleteAccount() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const user = useMemo(() => {
    try { return storage.get("currentAuth"); } catch { return null; }
  }, []);

  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");

  if (!user) {
    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>회원 탈퇴</h2>
        <p>로그인 정보가 없습니다.</p>
        <button className={styles.ghostBtn} onClick={() => navigate("/login")}>로그인으로</button>
      </div>
    );
  }

  const handleDelete = async (e) => {
    e.preventDefault();

    const authKey = storage.getAuthDataKey(user.id);
    const userKey = storage.getUserDataKey(user.id);
    const authData = storage.get(authKey);

    if (!authData || storage.hashPassword(password) !== authData.password) {
      showAlert("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (confirmText !== user.username) {
      showAlert(`확인을 위해 이름을 정확히 입력하세요: ${user.username}`);
      return;
    }

    // 소프트 삭제 플래그
    const deletedAt = new Date().toISOString();
    storage.set(authKey, { ...authData, isDeleted: true, deletedAt });

    const userData = storage.get(userKey) || {};
    storage.set(userKey, {
      ...userData,
      auth: { ...(userData.auth || {}), isDeleted: true, deletedAt },
    });

    // 세션 로그아웃
    storage.remove("currentAuth");
    logout();

    await showAlert("탈퇴 처리되었습니다. 기록은 보관됩니다.");
    navigate("/");
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>회원 탈퇴</h2>

      <div className={styles.infoBox}>
        <strong>안내</strong>
        <div className={styles.infoSub}>
          탈퇴 시 계정은 비활성화되며 로그인할 수 없습니다. 식단·운동 기록 등은 보관됩니다.
        </div>
      </div>

      <form onSubmit={handleDelete} className={styles.form}>
        <Input label="아이디" value={user.id} disabled />
        <Input label="이름" value={user.username} disabled />
        <Input
          label="현재 비밀번호"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="현재 비밀번호"
          autoComplete="current-password"
        />
        <Input
          label={`확인을 위해 ${user.username} 를 정확히 입력`}
          value={confirmText}
          onChange={setConfirmText}
          placeholder={`${user.username} 입력`}
        />

        <div className={styles.actions}>
          <button type="button" className={styles.ghostBtn} onClick={() => navigate(-1)}>
            취소
          </button>
          <button type="submit" className={styles.dangerBtn}>
            탈퇴 처리
          </button>
        </div>
      </form>
    </div>
  );
}

function Input({ label, value, onChange, disabled = false, type = "text", placeholder, autoComplete }) {
  return (
    <div>
      <label className={styles.label}>{label}</label>
      <input
        className={styles.input}
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
      />
    </div>
  );
}
