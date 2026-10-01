import React, { useEffect } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import Footer from './commons/layout/Footer';
import "__mock__/seedAdmin";
import seedAdmin from '__mock__/seedAdmin';

function Home() {
    const navigate = useNavigate();

    useEffect(() => {
      seedAdmin(); // 이미 있으면 아무 일 없음
    }, []);

    const handleStartClick = () => {
    navigate('/dashboard'); // 메인 페이지로 이동
    };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-blur-1"></div>
          <div className="hero-blur-2"></div>
          <div className="hero-blur-3"></div>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            AI 기반 맞춤형 헬스케어 분석
          </div>
          
          <h1 className="hero-title">
            건강한 삶을 위한<br />
            <span className="hero-title-gradient">스마트 헬스케어</span>
          </h1>
          
          <p className="hero-description">
            식단, 운동, 체중을 기록하고 AI가 분석한 맞춤형 건강 인사이트를 받아보세요. 
            더 건강하고 활력 넘치는 하루를 시작하세요.
          </p>
          
          <div className="hero-buttons">
            <button className="btn-primary" onClick={handleStartClick}>
              무료로 시작하기
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 12h14m-7-7l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <div className="hero-stats">
            <div>
              <div className="hero-stat-number">100,000+</div>
              <div className="hero-stat-label">활성 사용자</div>
            </div>
            <div>
              <div className="hero-stat-number">500만+</div>
              <div className="hero-stat-label">기록된 식단</div>
            </div>
            <div>
              <div className="hero-stat-number">98%</div>
              <div className="hero-stat-label">사용자 만족도</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              건강 관리의 모든 것을<br />
              <span className="section-title-highlight">하나로</span>
            </h2>
            <p className="section-description">
              복잡하고 번거로웠던 건강 관리를 간단하고 스마트하게 만들어보세요
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="feature-title">스마트 식단 관리</h3>
              <p className="feature-description">AI가 분석하는 영양성분과 칼로리, 개인 맞춤 식단 추천까지</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.5 5.5h-3a.5.5 0 0 0-.5.5v5a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5v-5a.5.5 0 0 0-.5-.5h-2z"/>
                </svg>
              </div>
              <h3 className="feature-title">운동 트래킹</h3>
              <p className="feature-description">다양한 운동 기록과 분석, 홈트레이닝 가이드 제공</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3v5h2V6h2V4H5V3zm6 0v2h2v2h2V5h-2V3zm6 0v2h2v2h2V3z"/>
                </svg>
              </div>
              <h3 className="feature-title">체중 분석</h3>
              <p className="feature-description">체중 변화 추이와 목표 달성을 위한 인사이트 제공</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
              </div>
              <h3 className="feature-title">통합 캘린더</h3>
              <p className="feature-description">식단, 운동, 체중을 한눈에 볼 수 있는 통합 관리 시스템</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="feature-title">목표 설정</h3>
              <p className="feature-description">개인 건강 목표 설정과 달성률 추적</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.75 1.75 0 0 0 18.3 7.5H15.7c-.65 0-1.24.37-1.52.95L11.64 16H14v6h6z"/>
                </svg>
              </div>
              <h3 className="feature-title">커뮤니티</h3>
              <p className="feature-description">같은 목표를 가진 사람들과의 건강한 경쟁과 응원</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section how-it-works-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              간단한 3단계로<br />
              <span className="section-title-highlight">건강해지기</span>
            </h2>
            <p className="section-description">
              복잡한 설정 없이, 바로 시작할 수 있어요
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-item">
              <div className="step-number-container">
                <div className="step-number">01</div>
              </div>
              <h3 className="step-title">기록하기</h3>
              <p className="step-description">일상의 식단, 운동, 체중을 간편하게 기록하세요</p>
            </div>

            <div className="step-item">
              <div className="step-number-container">
                <div className="step-number">02</div>
              </div>
              <h3 className="step-title">분석받기</h3>
              <p className="step-description">AI가 당신의 건강 데이터를 분석하고 인사이트를 제공합니다</p>
            </div>

            <div className="step-item">
              <div className="step-number-container">
                <div className="step-number">03</div>
              </div>
              <h3 className="step-title">실행하기</h3>
              <p className="step-description">맞춤 추천을 바탕으로 더 건강한 습관을 만들어가세요</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              사용자들의<br />
              <span className="section-title-highlight">진짜 후기</span>
            </h2>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar">👩‍💼</div>
                <div>
                  <h4 className="testimonial-name">김영희</h4>
                  <p className="testimonial-role">직장인</p>
                </div>
              </div>
              <div className="testimonial-stars">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <p className="testimonial-content">"바쁜 일상 속에서도 건강 관리를 쉽게 할 수 있게 되었어요. AI 분석이 정말 정확하고 유용해요!"</p>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar">👨‍🎓</div>
                <div>
                  <h4 className="testimonial-name">박민수</h4>
                  <p className="testimonial-role">대학생</p>
                </div>
              </div>
              <div className="testimonial-stars">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <p className="testimonial-content">"다이어트를 위해 시작했는데, 3개월 만에 10kg 감량에 성공했습니다. 정말 감사해요!"</p>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar">👩‍🍳</div>
                <div>
                  <h4 className="testimonial-name">이서진</h4>
                  <p className="testimonial-role">주부</p>
                </div>
              </div>
              <div className="testimonial-stars">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <p className="testimonial-content">"가족 건강 관리까지 한번에! 아이들 식단도 체계적으로 관리할 수 있어서 좋아요."</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta-section">
        <div className="cta-container">
          <h2 className="cta-title">지금 시작해보세요</h2>
          <p className="cta-description">
            수천 명의 사용자가 이미 건강한 변화를 경험하고 있습니다
          </p>
          
          <div className="cta-buttons">
            <button className="btn-cta-primary"onClick={handleStartClick}>시작하기</button>
            <button className="btn-cta-secondary">더 알아보기</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Home;