import React from "react";
import styles from "./css/PrivacyPolicy.module.css";

export default function PrivacyPolicy() {
  const updated = "2025-08-01";

  return (
    <div className={styles.wrap}>
      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.title}>개인정보 처리방침</h1>
        <p className={styles.subtitle}>
          HealthCare는 이용자의 개인정보를 안전하게 보호하고, 투명하게 처리합니다.
        </p>
        <div className={styles.meta}>최종 개정일: {updated}</div>

        <nav className={styles.toc} aria-label="목차">
          <a href="#sec1">1. 총칙</a>
          <a href="#sec2">2. 수집 항목·방법</a>
          <a href="#sec3">3. 이용 목적</a>
          <a href="#sec4">4. 보유·이용기간</a>
          <a href="#sec5">5. 제3자 제공/위탁</a>
          <a href="#sec6">6. 이용자 권리</a>
          <a href="#sec7">7. 안전성 확보조치</a>
          <a href="#sec8">8. 아동·민감정보</a>
          <a href="#sec9">9. 문의처</a>
          <a href="#sec10">10. 고지·변경</a>
        </nav>
      </section>

      {/* Sections */}
      <section id="sec1" className={styles.section}>
        <h2 className={styles.h2}>1. 총칙</h2>
        <p className={styles.p}>
          본 방침은 「개인정보 보호법」 등 관련 법령에 근거하여 이용자의 개인정보를 수집·이용·보관·파기하는 기준과
          권리 및 보호조치를 규정합니다. 본 서비스 이용 시 본 방침에 동의한 것으로 간주합니다.
        </p>
      </section>

      <section id="sec2" className={styles.section}>
        <h2 className={styles.h2}>2. 수집하는 항목과 방법</h2>
        <div className={styles.cardGrid}>
          <div className={styles.card}>
            <h3 className={styles.h3}>필수 항목</h3>
            <ul className={styles.ul}>
              <li>아이디, 비밀번호(해시), 이름, 닉네임</li>
              <li>이메일, 휴대전화, 생년월일</li>
              <li>서비스 이용기록(접속 로그, 기기정보, 쿠키)</li>
            </ul>
          </div>
          <div className={styles.card}>
            <h3 className={styles.h3}>선택 항목</h3>
            <ul className={styles.ul}>
              <li>주소(우편번호·기본/상세 주소)</li>
              <li>마케팅 수신 동의 여부</li>
            </ul>
          </div>
          <div className={styles.card}>
            <h3 className={styles.h3}>수집 방법</h3>
            <ul className={styles.ul}>
              <li>회원가입·서비스 이용 시 이용자 직접 입력</li>
              <li>자동 생성 정보(로그/쿠키) 수집</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="sec3" className={styles.section}>
        <h2 className={styles.h2}>3. 개인정보의 이용 목적</h2>
        <ul className={styles.ul}>
          <li>회원관리(가입의사 확인, 본인확인, 민원처리)</li>
          <li>서비스 제공(식단·운동·체중 기록, 통계·인사이트 제공)</li>
          <li>보안/부정이용 방지 및 서비스 품질 개선</li>
          <li>공지/알림 발송, 선택 동의 시 이벤트·혜택 안내</li>
        </ul>
      </section>

      <section id="sec4" className={styles.section}>
        <h2 className={styles.h2}>4. 보유 및 이용기간</h2>
        <p className={styles.p}>
          원칙적으로 회원 탈퇴 시 지체 없이 파기하며, 내부 정책에 따라 탈퇴 후 최대 <b>5일</b> 내 백업 영역에서도
          완전 파기합니다. 다만 법령에서 정한 기간 동안 보존이 필요한 경우 해당 기간 보관합니다.
        </p>
        <div className={styles.tableLike}>
          <div className={styles.tr}><div>전자상거래 등 계약·대금결제 기록</div><div>5년</div></div>
          <div className={styles.tr}><div>소비자 불만/분쟁 처리 기록</div><div>3년</div></div>
          <div className={styles.tr}><div>전자금융거래 기록</div><div>5년</div></div>
          <div className={styles.tr}><div>접속 로그·IP</div><div>3개월</div></div>
        </div>
      </section>

      <section id="sec5" className={styles.section}>
        <h2 className={styles.h2}>5. 제3자 제공 및 처리위탁</h2>
        <p className={styles.p}>
          원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만 법령에 의한 경우 또는 이용자 동의가 있는
          경우에 한해 최소한의 범위에서 제공할 수 있으며, 처리위탁이 필요한 경우 위탁받는 자·업무 내용·보유기간을
          사전에 고지하고 동의를 받습니다.
        </p>
      </section>

      <section id="sec6" className={styles.section}>
        <h2 className={styles.h2}>6. 이용자의 권리와 행사 방법</h2>
        <ul className={styles.ul}>
          <li>개인정보 열람·정정·삭제·처리정지 요구권</li>
          <li>동의 철회 및 회원 탈퇴</li>
          <li>대리인 권리행사 시 위임장 등 증빙 서류 확인</li>
        </ul>
        <p className={styles.note}>앱 내 프로필/설정 또는 고객센터를 통해 요청하실 수 있습니다.</p>
      </section>

      <section id="sec7" className={styles.section}>
        <h2 className={styles.h2}>7. 안전성 확보 조치</h2>
        <ul className={styles.ul}>
          <li>관리적: 개인정보 최소취급, 정기 교육, 접근권한 관리</li>
          <li>기술적: 비밀번호 해시 처리, 전송구간 암호화(HTTPS), 로그 모니터링</li>
          <li>물리적: 접근통제 및 백업·복구 체계 운영</li>
        </ul>
      </section>

      <section id="sec8" className={styles.section}>
        <h2 className={styles.h2}>8. 아동·민감정보 처리</h2>
        <p className={styles.p}>
          만 14세 미만 아동의 회원 가입은 제한하며, 건강에 관한 민감정보는 원칙적으로 수집하지 않습니다.
          이용자가 자발적으로 기록한 건강 데이터는 서비스 제공 목적 범위 내에서만 처리합니다.
        </p>
      </section>

      <section id="sec9" className={styles.section}>
        <h2 className={styles.h2}>9. 개인정보 보호책임자 및 문의처</h2>
        <div className={styles.card}>
          <div><b>책임자</b> : 개인정보보호팀</div>
          <div><b>이메일</b> : privacy@healthcare.local</div>
          <div><b>주소</b> : (00000) 서울시 …</div>
        </div>
        <p className={styles.pSmall}>
          또한 「개인정보 분쟁조정위원회(1833-6972)」 등 외부 기관에 분쟁 조정을 신청하실 수 있습니다.
        </p>
      </section>

      <section id="sec10" className={styles.section}>
        <h2 className={styles.h2}>10. 고지 및 변경</h2>
        <p className={styles.p}>
          본 방침의 내용 추가·삭제·수정이 있을 경우, 시행 7일 전 서비스 공지사항을 통해 고지합니다.
        </p>
        <details className={styles.details}>
          <summary>개정 이력 보기</summary>
          <ul className={styles.ulSmall}>
            <li>2025-08-01 : 초기 제정</li>
          </ul>
        </details>
      </section>
    </div>
  );
}
