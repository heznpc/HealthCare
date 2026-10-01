import { showAlert } from '../../../utils/dialogs';
import { localData } from "../../../utils/indexedStore.mjs";
// src/components/SignUpForm.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/useAuth';
import { storage } from '../../../utils/storage';
import styles from './SignUpForm.module.css';

export default function SignUpForm() {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    id: '', username: '', password: '', confirmPassword: '', email: '',
    phone: '', gender: '', birthDate: '', zipcode: '', address: '', detailAddress: '',
    hintQuestion: '', hintAnswer: '', role: 'user', nickname: '',
    agreeTerms: false, agreePrivacy: false, agreeMarketing: false
  });

  const [emailLocalPart, setEmailLocalPart] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [isCustomDomain, setIsCustomDomain] = useState(false);
  const [phoneParts, setPhoneParts] = useState({ part1: '', part2: '', part3: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [showPrivacyDetail, setShowPrivacyDetail] = useState(false);
  const [showTermsDetail, setShowTermsDetail] = useState(false);

  const predefinedDomains = useMemo(
    () => ['naver.com', 'gmail.com', 'daum.net', 'kakao.com', 'outlook.com', 'nate.com'], []
  );
  const hintQuestions = useMemo(() => [
    '기억에 남는 초등학교 선생님 성함은?','어린 시절 가장 친했던 친구 이름은?','가장 기억에 남는 여행지는?',
    '처음 키운 반려동물 이름은?','어머니의 성함은?','아버지의 성함은?','졸업한 초등학교 이름은?',
    '가장 좋아하는 음식은?','가장 좋아하는 영화는?','첫 직장의 회사 이름은?'
  ], []);
  const years = useMemo(() => { const y=new Date().getFullYear(); const s=y-100; const a=[]; for(let i=y;i>=s;i--) a.push(i); return a; }, []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const days = useMemo(() => {
    if (!selectedYear || !selectedMonth) return [];
    const last = new Date(selectedYear, selectedMonth, 0).getDate();
    return Array.from({ length: last }, (_, i) => i + 1);
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (selectedYear && selectedMonth && selectedDay) {
      const birthDate = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`;
      setForm(prev => ({ ...prev, birthDate }));
      const err = validateField('birthDate', birthDate, form);
      setErrors(prev => ({ ...prev, birthDate: err }));
    } else {
      setForm(prev => ({ ...prev, birthDate: '' }));
      setErrors(prev => ({ ...prev, birthDate: '생년월일을 입력해주세요.' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth, selectedDay]);

  const checkUserExists = (id) => {
    const user = storage.getUserById(id);
    if (user && user.auth?.isDeleted) return true;
    return !!user;
  };
  const checkNicknameExists = (nickname) => {
    const users = storage.getAllUsers();
    return users.some(u => u.profile?.nickname === nickname && !u.auth?.isDeleted);
  };
  const calculateAge = (birthDateString) => {
    if (!birthDateString) return null;
    const birth = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const validateField = (name, value, currentForm) => {
    let msg = '';
    switch (name) {
      case 'id':
        msg = value.length < 4 ? '아이디는 4자 이상이어야 합니다.' :
          (checkUserExists(value) ? '이미 사용중인 아이디입니다.' : '');
        break;
      case 'nickname':
        msg = !value.trim() ? '닉네임을 입력해주세요.' :
          (checkNicknameExists(value) ? '이미 사용중인 닉네임입니다.' : '');
        break;
      case 'password':
        msg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value)
          ? '' : '8자 이상, 대소문자·숫자·특수문자 포함';
        if (currentForm.confirmPassword) {
          setErrors(prev => ({ ...prev, confirmPassword: value === currentForm.confirmPassword ? '' : '비밀번호가 일치하지 않습니다.' }));
        }
        break;
      case 'confirmPassword':
        msg = value === currentForm.password ? '' : '비밀번호가 일치하지 않습니다.'; break;
      case 'username': msg = value.trim() ? '' : '이름을 입력해주세요.'; break;
      case 'phone': msg = /^\d{3}-\d{4}-\d{4}$/.test(value) ? '' : '전화번호 형식(010-xxxx-xxxx)'; break;
      case 'birthDate': {
        const age = calculateAge(value);
        if (!value) msg = '생년월일을 입력해주세요.';
        else if (age === null || isNaN(age) || age < 1 || age > 150) msg = '나이는 1~150세';
        break;
      }
      case 'zipcode': msg = value ? '' : '우편번호를 찾아주세요.'; break;
      case 'detailAddress': msg = value.trim() ? '' : '상세 주소를 입력해주세요.'; break;
      case 'hintQuestion': msg = value ? '' : '비밀번호 힌트 질문을 선택해주세요.'; break;
      case 'hintAnswer': msg = value.trim() ? '' : '힌트 정답을 입력해주세요.'; break;
      case 'email': msg = (value.includes('@') && value.includes('.')) ? '' : '올바른 이메일 주소'; break;
      case 'agreeTerms': msg = value ? '' : '이용약관에 동의해주세요.'; break;
      case 'agreePrivacy': msg = value ? '' : '개인정보 수집·이용에 동의해주세요.'; break;
      default: break;
    }
    return msg;
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    const v = type === 'checkbox' ? checked : value;
    setForm(prev => {
      const nf = { ...prev, [name]: v };
      const err = validateField(name, v, nf);
      setErrors(pe => ({ ...pe, [name]: err }));
      return nf;
    });
    setSubmitError(null);
  };

  const handleEmailLocalPartChange = (e) => {
    const local = e.target.value;
    setEmailLocalPart(local);
    const email = `${local}@${emailDomain}`;
    setForm(prev => ({ ...prev, email }));
    const err = validateField('email', email, { ...form, email });
    setErrors(prev => ({ ...prev, email: err }));
  };

  const handleDomainChange = (e) => {
    const newDomain = e.target.value;
    if (newDomain === 'custom') {
      setIsCustomDomain(true);
      setEmailDomain('');
      const email = `${emailLocalPart}@`;
      setForm(prev => ({ ...prev, email }));
      setErrors(prev => ({ ...prev, email: '올바른 이메일 주소' }));
    } else {
      setIsCustomDomain(false);
      setEmailDomain(newDomain);
      const email = `${emailLocalPart}@${newDomain}`;
      setForm(prev => ({ ...prev, email }));
      const err = validateField('email', email, { ...form, email });
      setErrors(prev => ({ ...prev, email: err }));
    }
  };

  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    const numeric = value.replace(/[^0-9]/g, '');
    setPhoneParts(prev => {
      const np = { ...prev, [name]: numeric };
      const full = `${np.part1}-${np.part2}-${np.part3}`;
      setForm(pf => {
        const nf = { ...pf, phone: full };
        const err = validateField('phone', full, nf);
        setErrors(pe => ({ ...pe, phone: err }));
        return nf;
      });
      return np;
    });
  };

  const handlePhoneInput = (e, nextName) => {
    if (e.target.value.length === e.target.maxLength && nextName) {
      const next = document.querySelector(`input[name=${nextName}]`);
      if (next) next.focus();
    }
  };

  const handlePostcode = () => {
    new window.daum.Postcode({
      oncomplete: (data) => {
        setForm(prev => ({ ...prev, zipcode: data.zonecode, address: data.address }));
        setErrors(prev => ({ ...prev, zipcode: '' }));
      },
    }).open();
  };

  const validateAllFields = () => {
    let ae = {}; let ok = true;
    const finalEmailDomain = emailDomain || 'gmail.com';
    const composedEmail = `${emailLocalPart}@${finalEmailDomain}`;
    const composedPhone = `${phoneParts.part1}-${phoneParts.part2}-${phoneParts.part3}`;

    const emailErr = validateField('email', composedEmail, { ...form, email: composedEmail });
    if (emailErr) { ae.email = emailErr; ok = false; }

    const required = [
      'id','nickname','username','password','confirmPassword','phone',
      'birthDate','hintQuestion','hintAnswer','agreeTerms','agreePrivacy'
    ];
    for (const f of required) {
      const val = f === 'phone' ? composedPhone : (f === 'email' ? composedEmail : form[f]);
      const err = validateField(f, val, { ...form, phone: composedPhone, email: composedEmail });
      if (err) { ae[f] = err; ok = false; }
    }

    if (!ok) {
      setSubmitError('다음 항목을 확인해주세요: ' + Object.keys(ae).join(', '));
    } else {
      setForm(prev => ({ ...prev, email: composedEmail, phone: composedPhone }));
    }
    setErrors(ae);
    return ok;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateAllFields()) return;

    try {
      const age = calculateAge(form.birthDate);
      if (age === null) { setSubmitError('생년월일이 유효하지 않습니다.'); return; }

      const payload = {
        ...form,
        age,
        consent: {
          terms: form.agreeTerms === true,
          privacy: form.agreePrivacy === true,
          marketing: form.agreeMarketing === true,
          version: "v1.0",
          agreedAt: new Date().toISOString(),
          notice: {
            purpose: "회원관리, 서비스 제공, 고지·문의응대",
            items: "아이디, 비밀번호, 이름, 닉네임, 이메일, 휴대전화, 생년월일, 주소(선택), 비밀번호 힌트",
            retention: "탈퇴 후 5일까지 또는 관련 법령 보존기간",
            refusal: "동의 거부 가능(단, 필수 항목 미동의 시 가입 불가)"
          }
        },
        profile: {
          ...form,
          username: form.username,
          nickname: form.nickname,
          age,
          birthDate: form.birthDate,
          hintQuestion: form.hintQuestion,
          hintAnswer: form.hintAnswer,
        },
      };

      const reg = await register(payload);
      if (reg.success) {
        const logged = await login({ id: form.id, password: form.password });
        if (logged.success) {
          localData.removeItem("welcomeModalDismissed");
          const ca = storage.get("currentAuth");
          if (ca) storage.set("currentAuth", { ...ca, isNewUser: true });
          await showAlert(`회원가입 완료! ${logged.migrated}개의 기록이 이전되었습니다.`);
          navigate('/dashboard?newUser=1', { state: { justSignedUp: true } });
        } else {
          await showAlert('회원가입은 완료되었지만 로그인에 실패했습니다. 다시 로그인해주세요.');
          navigate('/login');
        }
      } else {
        setSubmitError(reg.error || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setSubmitError('서버 오류로 회원가입에 실패했습니다.');
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>회원가입</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* 폭을 줄여 중앙 정렬 */}
        <div className={styles.formBody}>
          {/* 아이디 */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>아이디</label>
            <input className={styles.input} name="id" placeholder="아이디 (4자 이상)" value={form.id} onChange={handleChange}/>
            {errors.id && <p className={styles.error}>{errors.id}</p>}
          </div>

          {/* 닉네임 */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>닉네임</label>
            <input className={styles.input} name="nickname" placeholder="닉네임" value={form.nickname} onChange={handleChange}/>
            {errors.nickname && <p className={styles.error}>{errors.nickname}</p>}
          </div>

          {/* 이름 */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>이름</label>
            <input className={styles.input} name="username" placeholder="이름" value={form.username} onChange={handleChange}/>
            {errors.username && <p className={styles.error}>{errors.username}</p>}
          </div>

          {/* 비밀번호 */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>비밀번호</label>
            <input className={styles.input} type="password" name="password" placeholder="비밀번호" value={form.password} onChange={handleChange}/>
          </div>

          {/* 비밀번호 확인 */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>비밀번호 확인</label>
            <input className={styles.input} type="password" name="confirmPassword" placeholder="비밀번호 확인" value={form.confirmPassword} onChange={handleChange}/>
            {(errors.password || errors.confirmPassword) && (<p className={styles.error}>{errors.password || errors.confirmPassword}</p>)}
          </div>

          {/* 비밀번호 힌트 질문 */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>비밀번호 힌트 질문</label>
            <select className={styles.select} name="hintQuestion" value={form.hintQuestion} onChange={handleChange}>
              <option value="">질문 선택</option>
              {hintQuestions.map((q, i) => <option key={i} value={q}>{q}</option>)}
            </select>
            {errors.hintQuestion && <p className={styles.error}>{errors.hintQuestion}</p>}
          </div>

          {/* 힌트 정답 */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>힌트 정답</label>
            <input className={styles.input} name="hintAnswer" placeholder="힌트 정답" value={form.hintAnswer} onChange={handleChange}/>
            {errors.hintAnswer && <p className={styles.error}>{errors.hintAnswer}</p>}
          </div>

          {/* 이메일 */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>이메일</label>
            <div className={styles.emailContainer}>
              <input className={styles.emailInput} type="text" value={emailLocalPart} onChange={handleEmailLocalPartChange} placeholder="아이디"/>
              <span className={styles.atSymbol}>@</span>
              {isCustomDomain ? (
                <input
                  className={styles.emailInput}
                  type="text"
                  value={emailDomain}
                  onChange={(e)=>{ setEmailDomain(e.target.value);
                    const email=`${emailLocalPart}@${e.target.value}`;
                    setForm(prev=>({...prev,email}));
                    const err=validateField('email',email,{...form,email});
                    setErrors(prev=>({...prev,email:err})); }}
                  placeholder="도메인 직접 입력"
                />
              ) : (
                <select className={styles.select} value={emailDomain} onChange={handleDomainChange}>
                  <option value="">도메인 선택</option>
                  {predefinedDomains.map((d,i)=><option key={i} value={d}>{d}</option>)}
                  <option value="custom">직접 입력</option>
                </select>
              )}
            </div>
            {errors.email && <p className={styles.error}>{errors.email}</p>}
          </div>

          {/* 전화번호 */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>전화번호</label>
            <div className={styles.phoneContainer}>
              <input className={styles.phoneInput} type="tel" name="part1" maxLength="3" value={phoneParts.part1} onChange={handlePhoneChange} onInput={(e)=>handlePhoneInput(e,'part2')}/>
              <span className={styles.phoneSeparator}>-</span>
              <input className={styles.phoneInput} type="tel" name="part2" maxLength="4" value={phoneParts.part2} onChange={handlePhoneChange} onInput={(e)=>handlePhoneInput(e,'part3')}/>
              <span className={styles.phoneSeparator}>-</span>
              <input className={styles.phoneInput} type="tel" name="part3" maxLength="4" value={phoneParts.part3} onChange={handlePhoneChange} onInput={(e)=>handlePhoneInput(e,null)}/>
            </div>
            {errors.phone && <p className={styles.error}>{errors.phone}</p>}
          </div>

          {/* 성별 */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>성별</label>
            <select className={styles.select} name="gender" value={form.gender} onChange={handleChange}>
              <option value="">성별 선택</option>
              <option value="male">남자</option>
              <option value="female">여자</option>
            </select>
          </div>

          {/* 생년월일 */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>생년월일</label>
            <div className={styles.birthdateContainer}>
              <select className={styles.select} value={selectedYear} onChange={(e)=>setSelectedYear(e.target.value)}><option value="">연</option>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
              <span className={styles.separator}>년</span>
              <select className={styles.select} value={selectedMonth} onChange={(e)=>setSelectedMonth(e.target.value)}><option value="">월</option>{months.map(m=><option key={m} value={m}>{m}</option>)}</select>
              <span className={styles.separator}>월</span>
              <select className={styles.select} value={selectedDay} onChange={(e)=>setSelectedDay(e.target.value)}><option value="">일</option>{days.map(d=><option key={d} value={d}>{d}</option>)}</select>
              <span className={styles.separator}>일</span>
            </div>
            {errors.birthDate && <p className={styles.error}>{errors.birthDate}</p>}
          </div>

          {/* 주소(선택) */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>주소</label>
            <div className={styles.addressContainer}>
              <input className={styles.input} name="zipcode" placeholder="우편번호" value={form.zipcode} readOnly/>
              <button type="button" onClick={handlePostcode} className={styles.lookupBtn}>우편번호 찾기</button>
            </div>
            <input className={styles.input} style={{marginTop:8}} name="address" placeholder="기본 주소" value={form.address} readOnly/>
            <input className={styles.input} style={{marginTop:8}} name="detailAddress" placeholder="상세 주소" value={form.detailAddress} onChange={handleChange}/>
          </div>

          {/* 개인정보 고지 및 동의 */}
          <div className={styles.consentSection}>
            <h3 className={styles.consentTitle}>개인정보 수집·이용 고지</h3>

            <div className={styles.consentBox}>
              <button type="button" className={styles.consentToggle} onClick={()=>setShowPrivacyDetail(v=>!v)} aria-expanded={showPrivacyDetail}>
                {showPrivacyDetail ? '내용 접기' : '내용 보기'}
              </button>
              {showPrivacyDetail && (
                <div className={styles.consentDetail}>
                  <p><b>수집·이용 목적</b>: 회원관리, 서비스 제공, 고지·문의 응대</p>
                  <p><b>수집 항목</b>: 아이디, 비밀번호, 이름, 닉네임, 이메일, 휴대전화, 생년월일, 주소(선택), 비밀번호 힌트</p>
                  <p><b>보유·이용 기간</b>: 탈퇴 후 5일까지 또는 관련 법령 보존기간</p>
                  <p><b>동의 거부 권리</b>: 동의 거부 가능하나, 필수 항목 미동의 시 가입이 제한됩니다.</p>
                </div>
              )}
              <label className={styles.checkboxRow}>
                <input type="checkbox" name="agreePrivacy" checked={form.agreePrivacy} onChange={handleChange}/>
                <span>[필수] 개인정보 수집·이용에 동의합니다.</span>
              </label>
              {errors.agreePrivacy && <p className={styles.error}>{errors.agreePrivacy}</p>}
            </div>

            <div className={styles.consentBox}>
              <button type="button" className={styles.consentToggle} onClick={()=>setShowTermsDetail(v=>!v)} aria-expanded={showTermsDetail}>
                {showTermsDetail ? '약관 요약 접기' : '약관 요약 보기'}
              </button>
              {showTermsDetail && (<div className={styles.consentDetail}><p>서비스 이용 조건, 이용자 의무, 금지행위, 서비스 변경/중단, 책임 제한 등을 포함합니다.</p></div>)}

              <label className={styles.checkboxRow}>
                <input type="checkbox" name="agreeTerms" checked={form.agreeTerms} onChange={handleChange}/>
                <span>[필수] 이용약관에 동의합니다.</span>
              </label>
              {errors.agreeTerms && <p className={styles.error}>{errors.agreeTerms}</p>}
            </div>

            <div className={styles.consentBox}>
              <label className={styles.checkboxRow}>
                <input type="checkbox" name="agreeMarketing" checked={form.agreeMarketing} onChange={handleChange}/>
                <span>[선택] 이벤트·혜택 알림 수신에 동의합니다.</span>
              </label>
              <p className={styles.consentNote}>선택 동의 여부와 무관하게 서비스 이용이 가능합니다.</p>
            </div>
          </div>

          {submitError && <p className={styles.submitError}>{submitError}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!form.agreeTerms || !form.agreePrivacy}
            title={!form.agreeTerms || !form.agreePrivacy ? '필수 동의 후 가입 가능합니다.' : '가입하기'}
          >
            가입하기
          </button>
        </div>
      </form>
    </div>
  );
}
