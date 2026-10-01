// src/components/commons/member/FindPasswordForm.js

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../../utils/storage';
import './LoginForm.css';

function FindPasswordForm() {
  const navigate = useNavigate();

  const [id, setId] = useState('');
  const [step, setStep] = useState(1);
  const [selectedHintQuestion, setSelectedHintQuestion] = useState('');
  const [hintAnswer, setHintAnswer] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [tempPassword, setTempPassword] = useState('');

  const hintQuestions = useMemo(() => [
    "기억에 남는 초등학교 선생님 성함은?", "어린 시절 가장 친했던 친구 이름은?",
    "가장 기억에 남는 여행지는?", "처음 키운 반려동물 이름은?",
    "어머니의 성함은?", "아버지의 성함은?", "졸업한 초등학교 이름은?",
    "가장 좋아하는 음식은?", "가장 좋아하는 영화는?", "첫 직장의 회사 이름은?"
  ], []);

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleIdSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const foundUser = storage.getUserById(id);

    if (foundUser) {
      setUser(foundUser);
      setSelectedHintQuestion(foundUser.profile?.hintQuestion);
      setStep(2);
    } else {
      setError('존재하지 않는 아이디입니다.');
    }
  };

  const handleHintAnswerSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (user && user.profile?.hintAnswer === hintAnswer) {
      const newTempPassword = generateTempPassword();
      setTempPassword(newTempPassword);
      
      // 이 부분이 수정되었습니다.
      // 1. 임시 비밀번호를 hashPassword 함수로 해싱합니다.
      const newPasswordHash = storage.hashPassword(newTempPassword);

      // 2. 업데이트할 사용자 객체를 만듭니다.
      //    'auth' 필드의 'passwordHash'를 새로운 해시값으로 덮어씁니다.
      const updatedUserPayload = { 
          ...user,
          auth: { passwordHash: newPasswordHash },
      };
      
      // 3. storage.upsertUser 함수를 호출하여 로컬 스토리지에 업데이트합니다.
      storage.upsertUser(updatedUserPayload);
      
      setStep(3);
    } else {
      setError('비밀번호 힌트 답변이 올바르지 않습니다.');
    }
  };

  const handleGoBack = () => {
    setStep(1);
    setError(null);
    setId('');
    setHintAnswer('');
    setUser(null);
    setTempPassword('');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="login-container">
      <h2 className="login-heading">비밀번호 찾기</h2>
      
      {step === 1 && (
        <form onSubmit={handleIdSubmit} className="login-form">
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            비밀번호를 찾을 아이디를 입력해 주세요.
          </p>
          <input
            className="login-input"
            type="text"
            placeholder="아이디"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-button">다음</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleHintAnswerSubmit} className="login-form">
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            회원가입 시 입력했던 힌트 질문에 답해주세요.
          </p>
          <p style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}>
            질문: {selectedHintQuestion}
          </p>
          <input
            className="login-input"
            type="text"
            placeholder="힌트 정답"
            value={hintAnswer}
            onChange={(e) => setHintAnswer(e.target.value)}
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-button">비밀번호 찾기</button>
          <button type="button" onClick={handleGoBack} className="login-button" style={{ backgroundColor: '#aaa' }}>
            이전
          </button>
        </form>
      )}

      {step === 3 && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            새로운 임시 비밀번호가 발급되었습니다.
          </p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff', wordBreak: 'break-all' }}>
            {tempPassword}
          </p>
          <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
            로그인 후 비밀번호를 즉시 변경해 주세요.
          </p>
          <button onClick={handleGoToLogin} className="login-button" style={{ marginTop: '20px' }}>
            로그인 페이지로
          </button>
        </div>
      )}
    </div>
  );
}

export default FindPasswordForm;