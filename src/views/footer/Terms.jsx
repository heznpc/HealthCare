import React from "react";
import styles from "./css/Terms.module.css";

export default function Terms() {
  return (
    <div className={styles.wrap}>
      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.title}>이용 약관</h1>
        <p className={styles.subtitle}>
          본 약관은 HealthCare 서비스 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항을 규정합니다.
        </p>

        <ul className={styles.toc} aria-label="목차">
          <li><a href="#intro">1. 약관의 적용 및 변경</a></li>
          <li><a href="#account">2. 계정 및 보안</a></li>
          <li><a href="#use">3. 서비스 이용</a></li>
          <li><a href="#prohibit">4. 금지 행위</a></li>
          <li><a href="#content">5. 콘텐츠 및 지식재산권</a></li>
          <li><a href="#fees">6. 유료 서비스(해당 시)</a></li>
          <li><a href="#privacy">7. 개인정보 보호</a></li>
          <li><a href="#data">8. 데이터 보관 및 백업</a></li>
          <li><a href="#disclaimer">9. 면책</a></li>
          <li><a href="#liability">10. 책임의 제한</a></li>
          <li><a href="#change">11. 서비스 변경·중단</a></li>
          <li><a href="#law">12. 준거법 및 분쟁 해결</a></li>
          <li><a href="#contact">13. 문의</a></li>
        </ul>
      </section>

      <section id="intro" className={styles.section}>
        <h2 className={styles.h2}>1. 약관의 적용 및 변경</h2>
        <p className={styles.p}>
          본 약관은 서비스를 이용하는 모든 이용자(게스트 포함)에 적용됩니다. 회사는 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있으며,
          개정 시 공지사항 게시 또는 이메일 통지로 효력이 발생합니다. 변경에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.
        </p>
      </section>

      <section id="account" className={styles.section}>
        <h2 className={styles.h2}>2. 계정 및 보안</h2>
        <ul className={styles.list}>
          <li>회원은 정확한 정보를 제공·유지해야 하며, 계정 비밀번호 관리 책임은 회원에게 있습니다.</li>
          <li>게스트 모드는 기기 로컬 저장을 사용하며, 기기 변경/브라우저 초기화 시 데이터가 소실될 수 있습니다.</li>
          <li>무단 사용이 의심되면 즉시 회사에 알려야 합니다.</li>
        </ul>
      </section>

      <section id="use" className={styles.section}>
        <h2 className={styles.h2}>3. 서비스 이용</h2>
        <details className={styles.item} open>
          <summary className={styles.summary}>기능</summary>
          <div className={styles.answer}>
            식단·운동·체중 기록, 분석, 홈 트레이닝, 즐겨찾기, 커뮤니티(도입 시) 등의 기능을 제공합니다.
          </div>
        </details>
        <details className={styles.item}>
          <summary className={styles.summary}>연령 및 의학적 고지</summary>
          <div className={styles.answer}>
            본 서비스는 만 14세 이상을 대상으로 하며 의료행위를 제공하지 않습니다. 건강 관련 결정은 전문가와 상담하세요.
          </div>
        </details>
      </section>

      <section id="prohibit" className={styles.section}>
        <h2 className={styles.h2}>4. 금지 행위</h2>
        <ul className={styles.list}>
          <li>타인의 권리 침해, 불법·유해 정보 게시, 서비스 역설계/크롤링/자동화 남용</li>
          <li>허위 정보 등록, 타인 사칭, 계정 대여·양도</li>
          <li>정상적 운영을 방해하는 모든 행위</li>
        </ul>
      </section>

      <section id="content" className={styles.section}>
        <h2 className={styles.h2}>5. 콘텐츠 및 지식재산권</h2>
        <p className={styles.p}>
          서비스 및 그 구성요소에 대한 권리는 회사 또는 라이선스 제공자에게 있습니다.
          이용자가 업로드한 콘텐츠의 저작권은 이용자에게 있으나, 서비스 제공·운영·개선 목적의 비독점적 사용권을 회사에 부여합니다.
          이용자는 본인이 권리를 보유한 자료만 업로드해야 합니다.
        </p>
      </section>

      <section id="fees" className={styles.section}>
        <h2 className={styles.h2}>6. 유료 서비스(해당 시)</h2>
        <p className={styles.p}>
          유료 기능 도입 시 요금제·환불·해지 정책을 별도 안내합니다. 결제 후 제공된 디지털 서비스의 특성상
          관련 법령에 따른 환불 제한이 있을 수 있습니다.
        </p>
      </section>

      <section id="privacy" className={styles.section}>
        <h2 className={styles.h2}>7. 개인정보 보호</h2>
        <p className={styles.p}>
          개인정보 처리에 관한 사항은 <a className={styles.link} href="/policy/privacy">개인정보 처리방침</a>을 따릅니다.
          필수 동의가 없는 경우 회원 가입 및 서비스 제공이 제한될 수 있습니다.
        </p>
      </section>

      <section id="data" className={styles.section}>
        <h2 className={styles.h2}>8. 데이터 보관 및 백업</h2>
        <ul className={styles.list}>
          <li>법령 또는 내부 정책에 따른 보존 기간을 제외하고, 회원 탈퇴 시 지체 없이 파기합니다.</li>
          <li>게스트 데이터는 브라우저 저장소에 보관되며 회사가 백업하지 않습니다.</li>
        </ul>
      </section>

      <section id="disclaimer" className={styles.section}>
        <h2 className={styles.h2}>9. 면책</h2>
        <p className={styles.p}>
          천재지변, 통신 장애, 외부 플랫폼(유튜브 등) 변경, 이용자 귀책으로 인한 손해에 대해서 회사는 책임지지 않습니다.
          제공 정보는 참고용이며 의학적 자문을 대체하지 않습니다.
        </p>
      </section>

      <section id="liability" className={styles.section}>
        <h2 className={styles.h2}>10. 책임의 제한</h2>
        <p className={styles.p}>
          회사의 과실이 없는 한 간접·특별·결과적 손해에 대해 책임을 지지 않으며,
          유상 서비스의 경우 법령이 허용하는 범위 내에서 최근 3개월간 이용자가 지급한 금액을 한도로 합니다.
        </p>
      </section>

      <section id="change" className={styles.section}>
        <h2 className={styles.h2}>11. 서비스 변경·중단</h2>
        <p className={styles.p}>
          회사는 운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 변경·중단할 수 있으며,
          중대한 변경은 사전에 공지합니다.
        </p>
      </section>

      <section id="law" className={styles.section}>
        <h2 className={styles.h2}>12. 준거법 및 분쟁 해결</h2>
        <p className={styles.p}>
          본 약관은 대한민국 법을 준거법으로 하며, 분쟁은 민사소송법상의 관할법원에 제기합니다.
        </p>
      </section>

      <section id="contact" className={styles.section}>
        <h2 className={styles.h2}>13. 문의</h2>
        <p className={styles.p}>
          약관 관련 문의: <a className={styles.link} href="mailto:legal@healthcare.local">legal@healthcare.local</a>
        </p>
        <div className={styles.note}>시행일: 2025-08-24</div>
      </section>
    </div>
  );
}
