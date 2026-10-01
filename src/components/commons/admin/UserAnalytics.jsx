import React from 'react';
import './css/UserAnalytics.css';
import BarChart from './charts/BarChart';
import UserTable from './UserTable';

const UserAnalytics = ({ 
  chartData, 
  todaySubTab, 
  setTodaySubTab, 
  getDateRangeUsers,
  genderFilter,
  setGenderFilter,
  ageFilter,
  setAgeFilter,
  currentPages,
  handlePageChange
}) => {
  
  const getAge = (user) => {
    return user.profile?.age || null;
  };

  const getAgeGroup = (age) => {
    if (age === null || age === undefined) return 'unknown';
    if (age < 20) return '10s';
    if (age < 30) return '20s';
    if (age < 40) return '30s';
    if (age < 50) return '40s';
    if (age < 60) return '50s';
    return '60plus';
  };

  const renderTodaySubTabs = () => {
    return (
      <div className="sub-tabs">
        <button 
          className={`sub-tab ${todaySubTab === 'period' ? 'active' : ''}`}
          onClick={() => setTodaySubTab('period')}
        >
          기간별
        </button>
        <button 
          className={`sub-tab ${todaySubTab === 'gender' ? 'active' : ''}`}
          onClick={() => setTodaySubTab('gender')}
        >
          성별
        </button>
        <button 
          className={`sub-tab ${todaySubTab === 'age' ? 'active' : ''}`}
          onClick={() => setTodaySubTab('age')}
        >
          나이대별
        </button>
      </div>
    );
  };

  const renderPeriodAnalysis = () => {
    const todayUsers = getDateRangeUsers(1);
    const weekUsers = getDateRangeUsers(7);
    const monthUsers = getDateRangeUsers(30);

    const periodData = {
      labels: ['오늘', '1주일', '1개월'],
      datasets: [{
        label: '가입자 수',
        data: [todayUsers.length, weekUsers.length, monthUsers.length],
        backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
        borderColor: ['#FF5252', '#26A69A', '#2196F3'],
        borderWidth: 1
      }]
    };

    const columns = [
      { key: 'username', label: '사용자명' },
      { key: 'id', label: '아이디' },
      { key: 'gender', label: '성별' },
      { key: 'age', label: '나이' },
      { key: 'role', label: '권한' },
      { key: 'createdAt', label: '가입일' }
    ];

    return (
      <div className="analysis-container">
        <div className="chart-section">
          <BarChart data={periodData} title="기간별 가입자 현황" />
        </div>
        <div className="list-section">
          <UserTable
            users={monthUsers}
            columns={columns}
            currentPage={currentPages.period}
            itemsPerPage={5}
            onPageChange={(page) => handlePageChange('period', page)}
            title="1개월 내 가입자 목록"
          />
        </div>
      </div>
    );
  };

  const renderGenderAnalysis = () => {
    const monthUsers = getDateRangeUsers(30);
    const genderStats = monthUsers.reduce((acc, user) => {
      const gender = user.profile?.gender || 'unknown';
      const genderLabel = gender === 'male' ? '남성' : 
                          gender === 'female' ? '여성' : '미설정';
      acc[genderLabel] = (acc[genderLabel] || 0) + 1;
      return acc;
    }, {});

    const genderData = {
      labels: Object.keys(genderStats),
      datasets: [{
        label: '가입자 수',
        data: Object.values(genderStats),
        backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'],
        borderColor: ['#36A2EB', '#FF6384', '#FFCE56'],
        borderWidth: 1
      }]
    };

    const filteredUsers = monthUsers.filter(user => 
      genderFilter === 'all' || user.profile?.gender === genderFilter
    );

    const columns = [
      { key: 'username', label: '사용자명' },
      { key: 'id', label: '아이디' },
      { key: 'age', label: '나이' },
      { key: 'role', label: '권한' },
      { key: 'createdAt', label: '가입일' }
    ];

    return (
      <div className="analysis-container">
        <div className="chart-section">
          <BarChart data={genderData} title="성별 가입자 현황 (1개월)" />
        </div>
        <div className="list-section">
          <h4>성별 가입자 목록</h4>
          <div className="gender-tabs">
            <button onClick={() => setGenderFilter('all')} className={genderFilter === 'all' ? 'active' : ''}>전체</button>
            <button onClick={() => setGenderFilter('male')} className={genderFilter === 'male' ? 'active' : ''}>남성</button>
            <button onClick={() => setGenderFilter('female')} className={genderFilter === 'female' ? 'active' : ''}>여성</button>
          </div>
          <UserTable
            users={filteredUsers}
            columns={columns}
            currentPage={currentPages.gender}
            itemsPerPage={5}
            onPageChange={(page) => handlePageChange('gender', page)}
          />
        </div>
      </div>
    );
  };

  const renderAgeAnalysis = () => {
    const monthUsers = getDateRangeUsers(30);
    const ageStats = monthUsers.reduce((acc, user) => {
      const age = getAge(user);
      const ageGroup = getAgeGroup(age);
      const ageLabel = getAgeGroupLabel(ageGroup);
      acc[ageLabel] = (acc[ageLabel] || 0) + 1;
      return acc;
    }, {});

    const ageData = {
      labels: Object.keys(ageStats),
      datasets: [{
        label: '가입자 수',
        data: Object.values(ageStats),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ],
        borderColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ],
        borderWidth: 1
      }]
    };

    const filteredUsers = monthUsers.filter(user => {
      if (ageFilter === 'all') return true;
      const age = getAge(user);
      const ageGroup = getAgeGroup(age);
      return ageGroup === ageFilter;
    });

    const columns = [
      { key: 'username', label: '사용자명' },
      { key: 'id', label: '아이디' },
      { key: 'gender', label: '성별' },
      { key: 'age', label: '나이' },
      { key: 'role', label: '권한' },
      { key: 'createdAt', label: '가입일' }
    ];

    return (
      <div className="analysis-container">
        <div className="chart-section">
          <BarChart data={ageData} title="연령대별 가입자 현황 (1개월)" />
        </div>
        <div className="list-section">
          <h4>연령대별 가입자 목록</h4>
          <div className="age-tabs">
            <button onClick={() => setAgeFilter('all')} className={ageFilter === 'all' ? 'active' : ''}>전체</button>
            <button onClick={() => setAgeFilter('10s')} className={ageFilter === '10s' ? 'active' : ''}>10대</button>
            <button onClick={() => setAgeFilter('20s')} className={ageFilter === '20s' ? 'active' : ''}>20대</button>
            <button onClick={() => setAgeFilter('30s')} className={ageFilter === '30s' ? 'active' : ''}>30대</button>
            <button onClick={() => setAgeFilter('40s')} className={ageFilter === '40s' ? 'active' : ''}>40대</button>
            <button onClick={() => setAgeFilter('50s')} className={ageFilter === '50s' ? 'active' : ''}>50대</button>
            <button onClick={() => setAgeFilter('60plus')} className={ageFilter === '60plus' ? 'active' : ''}>60대+</button>
          </div>
          <UserTable
            users={filteredUsers}
            columns={columns}
            currentPage={currentPages.age}
            itemsPerPage={5}
            onPageChange={(page) => handlePageChange('age', page)}
          />
        </div>
      </div>
    );
  };

  const getAgeGroupLabel = (ageGroup) => {
    switch (ageGroup) {
      case '10s': return '10대';
      case '20s': return '20대';
      case '30s': return '30대';
      case '40s': return '40대';
      case '50s': return '50대';
      case '60plus': return '60대 이상';
      default: return '미설정';
    }
  };

  const renderTodaySubContent = () => {
    switch (todaySubTab) {
      case 'period':
        return renderPeriodAnalysis();
      case 'gender':
        return renderGenderAnalysis();
      case 'age':
        return renderAgeAnalysis();
      default:
        return renderPeriodAnalysis();
    }
  };

  const renderChartsTab = () => {
    const ageBarData = {
      labels: Object.keys(chartData.all.ageDistribution),
      datasets: [{
        label: '사용자 수',
        data: Object.values(chartData.all.ageDistribution),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E74C3C'
        ],
        borderColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E74C3C'
        ],
        borderWidth: 1
      }]
    };

    const genderBarData = {
      labels: Object.keys(chartData.all.genderDistribution),
      datasets: [{
        label: '사용자 수',
        data: Object.values(chartData.all.genderDistribution),
        backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'],
        borderColor: ['#36A2EB', '#FF6384', '#FFCE56'],
        borderWidth: 1
      }]
    };

    return (
      <div className="tab-data">
        <h3>사용자 통계 차트</h3>
        <div className="charts-container">
          <div className="chart-section">
            <BarChart 
              data={ageBarData} 
              title="연령대별 사용자 분포" 
            />
          </div>
          <div className="chart-section">
            <BarChart 
              data={genderBarData} 
              title="성별 사용자 분포" 
            />
          </div>
        </div>
        
        <div className="chart-stats">
          <h4>상세 통계</h4>
          <div className="stats-grid">
            <div className="stat-group">
              <h5>연령대별</h5>
              {Object.entries(chartData.all.ageDistribution).map(([age, count]) => (
                <div key={age} className="stat-row">
                  <span>{age}</span>
                  <span>{count}명</span>
                </div>
              ))}
            </div>
            <div className="stat-group">
              <h5>성별</h5>
              {Object.entries(chartData.all.genderDistribution).map(([gender, count]) => (
                <div key={gender} className="stat-row">
                  <span>{gender}</span>
                  <span>{count}명</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return {
    renderTodaySubTabs,
    renderTodaySubContent,
    renderChartsTab
  };
};

export default UserAnalytics;