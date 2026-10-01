import { showAlert } from '../../../utils/dialogs';
// src/features/account/views/LoginForm.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/useAuth';
import { storage } from '../../../utils/storage';
import './LoginForm.css';

function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ id: '', password: '' });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 소프트 삭제 계정 차단
    const userData = storage.getUserById(form.id);
    if (userData && userData.auth?.isDeleted) {
      setError('해당 계정은 탈퇴된 상태라 로그인할 수 없습니다.');
      return;
    }

    const result = await login(form);

    if (result.success) {
      await showAlert(result.migrated ? `로그인되었습니다. 체험 기록 ${result.migrated}개가 이전되었습니다.` : '로그인되었습니다.', { title: '로그인 완료' });
      navigate('/dashboard'); // 필요시 권한별 분기
    } else {
      setError(result.error || '로그인 실패');
    }
  };

  const handleFindPasswordClick = (e) => {
    e.preventDefault();
    navigate('/login/find-password');
  };

  return (
    <div className="login-container">
      <h2 className="login-heading">로그인</h2>

      <form onSubmit={handleSubmit} className="login-form">
        <input
          className="login-input"
          name="id"
          placeholder="아이디"
          value={form.id}
          onChange={handleChange}
        />
        <input
          className="login-input"
          type="password"
          name="password"
          placeholder="비밀번호"
          value={form.password}
          onChange={handleChange}
          autoComplete="current-password"
        />

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="login-button">
          로그인
        </button>
      </form>

      <div className="link-container">
        <a href="#" onClick={handleFindPasswordClick} className="find-password-link">
          비밀번호를 잊으셨나요?
        </a>
        <br />
        <Link to="/signup" className="signup-link">
          회원가입
        </Link>
      </div>
    </div>
  );
}

export default LoginForm;
