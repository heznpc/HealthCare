import { showAlert } from '../utils/dialogs';
// src/views/ProfileEdit.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { storage } from "../utils/storage";
import styles from "./css/ProfileEdit.module.css";

function ProfileEdit() {
  const navigate = useNavigate();
  const { checkAuthStatus } = useAuth();

  const hintQuestions = [
    "기억에 남는 초등학교 선생님 성함은?",
    "어린 시절 가장 친했던 친구 이름은?",
    "가장 기억에 남는 여행지는?",
    "처음 키운 반려동물 이름은?",
    "어머니의 성함은?",
    "아버지의 성함은?",
    "졸업한 초등학교 이름은?",
    "가장 좋아하는 음식은?",
    "가장 좋아하는 영화는?",
    "첫 직장의 회사 이름은?",
  ];

  // 비밀번호 확인 게이트
  const [verified, setVerified] = useState(false);
  const [verifyPwd, setVerifyPwd] = useState("");
  const [expectedHash, setExpectedHash] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");

  const [form, setForm] = useState({
    id: "",
    username: "",
    email: "",
    phone: "",
    zipcode: "",
    address: "",
    detailAddress: "",
    gender: "",
    age: "",
    hintQuestion: "",
    hintAnswer: "",
    role: "user",
    userKey: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    storage.migrateLegacyUsersIfNeeded();

    const current = storage.get("currentAuth");
    if (!current?.id) {
      showAlert("로그인이 필요합니다.").then(() => navigate("/login"));
      return;
    }
    setCurrentUserId(current.id);

    const rec = storage.getUserById(current.id);
    if (!rec) {
      showAlert("회원 정보를 찾을 수 없습니다.").then(() => navigate("/login"));
      return;
    }
    setExpectedHash(rec?.auth?.passwordHash || null);

    const p = rec.profile || {};
    setForm((prev) => ({
      ...prev,
      id: rec.id || "",
      username: p.username || "",
      email: p.email || "",
      phone: p.phone || "",
      zipcode: p.zipcode || "",
      address: p.address || "",
      detailAddress: p.detailAddress || "",
      gender: p.gender || "",
      age: p.age || "",
      hintQuestion: p.hintQuestion || "",
      hintAnswer: p.hintAnswer || "",
      role: rec.role || "user",
      userKey: rec.userKey || p.userKey || "",
      password: "",
      confirmPassword: "",
    }));
  }, [navigate]);

  // 게이트 확인
  const handleVerify = (e) => {
    e.preventDefault();
    // 비밀번호가 저장되지 않은 계정은 통과 처리
    if (!expectedHash) {
      setVerified(true);
      return;
    }
    const inputHash = storage.hashPassword(verifyPwd);
    if (inputHash !== expectedHash) {
      showAlert("현재 비밀번호가 일치하지 않습니다.");
      return;
    }
    setVerified(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handlePostcode = () => {
    if (!window?.daum?.Postcode) {
      showAlert("우편번호 서비스 스크립트를 확인하세요.");
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data) => {
        setForm((s) => ({
          ...s,
          zipcode: data.zonecode,
          address: data.address,
        }));
      },
    }).open();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const required = ["id", "username", "email", "phone", "gender", "age", "hintQuestion", "hintAnswer"];
    for (const k of required) {
      if (!String(form[k] ?? "").trim()) {
        showAlert("필수 항목을 모두 입력하세요.");
        return;
      }
    }

    let nextPasswordHash = null;
    if (form.password || form.confirmPassword) {
      if (form.password !== form.confirmPassword) {
        showAlert("비밀번호가 일치하지 않습니다.");
        return;
      }
      nextPasswordHash = storage.hashPassword(form.password);
    } else {
      const rec = storage.getUserById(form.id);
      nextPasswordHash = rec?.auth?.passwordHash || null;
    }

    const userKey = storage.upsertUser({
      id: form.id,
      profile: {
        username: form.username,
        email: form.email,
        phone: form.phone,
        zipcode: form.zipcode,
        address: form.address,
        detailAddress: form.detailAddress,
        gender: form.gender,
        age: form.age,
        hintQuestion: form.hintQuestion,
        hintAnswer: form.hintAnswer,
        userKey: form.userKey, // 이후 보정
      },
      auth: { passwordHash: nextPasswordHash },
      role: form.role,
      createdAt: new Date().toISOString(),
    });

    const rec2 = storage.getUserByKey(userKey);
    if (rec2) {
      rec2.profile = { ...(rec2.profile || {}), userKey };
      const users = storage.get("users") || {};
      users[userKey] = rec2;
      storage.set("users", users);
    }

    storage.set("currentAuth", {
      id: form.id,
      username: form.username,
      role: form.role,
      userKey,
    });

    checkAuthStatus();
    await showAlert("정보가 수정되었습니다.");
    navigate("/");
  };

  // 게이트 화면
  if (!verified) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>정보수정</h2>
        <form onSubmit={handleVerify} className={styles.formGrid} style={{ maxWidth: 480 }}>
          <p style={{ textAlign: "center", marginBottom: "8px" }}>
            개인 정보 보호를 위해 현재 비밀번호를 입력해주세요.
          </p>
          <input
            type="password"
            value={verifyPwd}
            onChange={(e) => setVerifyPwd(e.target.value)}
            placeholder="현재 비밀번호"
            className={styles.input}
            autoFocus
          />
          <button type="submit" className={styles.btnPrimary}>확인</button>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <Link to="/" className={styles.btnSecondary}>취소</Link>
          </div>
        </form>
      </div>
    );
  }

  // 본 폼
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>정보수정</h2>

      <form onSubmit={handleSubmit} className={styles.formGrid}>
        <Input name="id" value={form.id} onChange={handleChange} readOnly placeholder="아이디" />
        <Input name="username" value={form.username} onChange={handleChange} placeholder="사용자명" />
        <Input name="email" value={form.email} onChange={handleChange} type="email" placeholder="이메일" />
        <Input name="phone" value={form.phone} onChange={handleChange} type="tel" placeholder="전화번호" />

        <div className={styles.rowFlex}>
          <Input name="zipcode" value={form.zipcode} onChange={handleChange} readOnly placeholder="우편번호" />
          <button type="button" onClick={handlePostcode} className={styles.btnSecondary}>
            우편번호 찾기
          </button>
        </div>

        <Input name="address" value={form.address} onChange={handleChange} readOnly placeholder="기본 주소" />
        <Input name="detailAddress" value={form.detailAddress} onChange={handleChange} placeholder="상세 주소" />

        <select name="gender" value={form.gender} onChange={handleChange} className={styles.select}>
          <option value="">성별 선택</option>
          <option value="male">남자</option>
          <option value="female">여자</option>
          <option value="other">기타</option>
        </select>

        <Input name="age" value={form.age} onChange={handleChange} type="number" min="0" placeholder="나이" />

        <select name="hintQuestion" value={form.hintQuestion} onChange={handleChange} className={styles.select}>
          <option value="">비밀번호 힌트 질문 선택</option>
          {hintQuestions.map((q, i) => (
            <option key={i} value={q}>{q}</option>
          ))}
        </select>

        <Input name="hintAnswer" value={form.hintAnswer} onChange={handleChange} placeholder="힌트 정답" />

        <Input name="password" value={form.password} onChange={handleChange} type="password" placeholder="새 비밀번호(선택)" />
        <Input name="confirmPassword" value={form.confirmPassword} onChange={handleChange} type="password" placeholder="새 비밀번호 확인(선택)" />

        {/* 역할(role), 키(userKey) 입력 필드 제거됨 */}

        <button type="submit" className={styles.btnPrimary}>수정 완료</button>
      </form>

      <div className={styles.deleteWrapper}>
        <Link to="/user/delete-account" className={styles.deleteLink}>
          회원탈퇴
        </Link>
      </div>
    </div>
  );
}

function Input({ name, value, onChange, placeholder, type = "text", readOnly = false, min }) {
  return (
    <input
      type={type}
      name={name}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      min={min}
      className={styles.input}
    />
  );
}

export default ProfileEdit;
