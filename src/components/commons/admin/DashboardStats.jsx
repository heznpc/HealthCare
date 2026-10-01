import React from 'react';
import './css/DashboardStats.css';

const DashboardStats = ({ stats, activeTab, setActiveTab }) => {
  return (
    <div className="dashboard-stats">
      <div className={`stat-card ${activeTab === 'total' ? 'active' : ''}`} onClick={() => setActiveTab('total')}>
        <h3>전체 사용자</h3>
        <div className="stat-number">{stats.totalUsers}</div>
      </div>
      
      <div className={`stat-card admin-tab ${activeTab === 'admins' ? 'active' : ''}`} onClick={() => setActiveTab('admins')}>
        <h3>관리자 계정</h3>
        <div className="stat-number">{stats.roleDistribution.ADMIN}</div>
      </div>
      
      <div className={`stat-card member-tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
        <h3>멤버 계정</h3>
        <div className="stat-number">{stats.roleDistribution.MEMBER}</div>
      </div>
      
      <div className={`stat-card ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
        <h3>관리자 권한 관리</h3>
        <div className="stat-number">{stats.activeUsers}</div>
      </div>
      
      <div className={`stat-card ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
        <h3>관리자 승인 대기</h3>
        <div className="stat-number">{stats.pendingUsers}</div>
      </div>
      
      <div className={`stat-card ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>
        <h3>회원 통계</h3>
        <div className="stat-number">👥</div>
      </div>
      
      <div className={`stat-card ${activeTab === 'charts' ? 'active' : ''}`} onClick={() => setActiveTab('charts')}>
        <h3>사용자 통계 차트</h3>
        <div className="stat-number">📊</div>
      </div>

      <div className={`stat-card ${activeTab === 'deleted' ? 'active' : ''}`} onClick={() => setActiveTab('deleted')}>
        <h3>삭제된 계정</h3>
        <div className="stat-number">{stats.deletedUsers}</div>
      </div>
    </div>
  );
};

export default DashboardStats;  