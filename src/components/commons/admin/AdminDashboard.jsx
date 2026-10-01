import { showAlert, showConfirm } from '../../../utils/dialogs';
import { useAuth } from 'auth/useAuth';
import React, { useState, useEffect } from 'react';
import { storage } from 'utils/storage';
import { USER_STATUS } from './utils/constants';
import UserFilters from './UserFilters';
import UserTable from './UserTable';
import UserAnalytics from './UserAnalytics';
import DashboardStats from './DashboardStats';

import './css/AdminDashboard.css';


const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    deletedUsers: 0,
    pendingUsers: 0,
    roleDistribution: { GUEST: 0, MEMBER: 0, ADMIN: 0 }
  });

  const [recentUsers, setRecentUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [isFirstAdmin, setIsFirstAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [genderFilter, setGenderFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [todaySubTab, setTodaySubTab] = useState('period');
  
  // 페이지네이션 상태
  const [currentPages, setCurrentPages] = useState({
    total: 1,
    active: 1,
    deleted: 1,
    admins: 1,
    members: 1,
    pending: 1,
    period: 1,
    gender: 1,
    age: 1
  });


  const [chartData, setChartData] = useState({
    all: { ageDistribution: {}, genderDistribution: {} },
    admin: { ageDistribution: {}, genderDistribution: {} },
    member: { ageDistribution: {}, genderDistribution: {} },
  });

  const checkFirstAdminStatus = React.useCallback(() => {
    if (user?.id) {
      setIsFirstAdmin(storage.isFirstAdmin(user.id));
    }
  }, [user?.id]);

  const calculateChartData = React.useCallback(() => {
    const allUsers = storage.getAllUsers();
    const activeUsers = storage.getActiveUsers();
    const adminUsers = activeUsers.filter(user => user.role === 'ADMIN');
    const memberUsers = activeUsers.filter(user => user.role === 'MEMBER');

    const calculateDistribution = (users) => {
      const ageDistribution = users.reduce((acc, user) => {
        const age = getAge(user);
        const ageGroup = getAgeGroup(age);
        const ageLabel = getAgeGroupLabel(ageGroup);
        acc[ageLabel] = (acc[ageLabel] || 0) + 1;
        return acc;
      }, {});

      const genderDistribution = users.reduce((acc, user) => {
        const gender = user.profile?.gender;
        const genderLabel = gender === 'male' ? '남성' : 
                          gender === 'female' ? '여성' : '미설정';
        acc[genderLabel] = (acc[genderLabel] || 0) + 1;
        return acc;
      }, {});

      return { ageDistribution, genderDistribution };
    };

    setChartData({
      all: calculateDistribution(allUsers),
      admin: calculateDistribution(adminUsers),
      member: calculateDistribution(memberUsers)
    });
  }, []);

  const loadDashboardData = React.useCallback(() => {
    storage.migrateLegacyUsersIfNeeded();
    
    const allUsers = storage.getAllUsers();
    const activeUsers = storage.getActiveUsers();
    const deletedUsers = storage.getDeletedUsers();
    const pendingUsers = allUsers.filter(user => user.status === USER_STATUS.PENDING);
    

    const roleDistribution = activeUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, { GUEST: 0, MEMBER: 0, ADMIN: 0 });

    const recent = allUsers
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    setStats({
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      deletedUsers: deletedUsers.length,
      pendingUsers: pendingUsers.length,
      // newUsersToday,
      roleDistribution
    });

    setRecentUsers(recent);
    calculateChartData();
    setPendingUsers(pendingUsers);
  }, [calculateChartData]);

  useEffect(() => {
    loadDashboardData();
    checkFirstAdminStatus();
  }, [user, loadDashboardData, checkFirstAdminStatus]);



  const handlePromoteUser = async (userId) => {
    if (!isFirstAdmin) {
      showAlert('최초 관리자만 멤버를 승격할 수 있습니다.');
      return;
    }
    
    if (await showConfirm('이 사용자를 관리자로 승격시키겠습니까?')) {
      const success = storage.promoteToAdmin(userId);
      if (success) {
        showAlert('사용자가 관리자로 승격되었습니다.');
        loadDashboardData();
      } else {
        showAlert('승격 처리에 실패했습니다.');
      }
    }
  };

  const handleDemoteUser = async (userId) => {
    if (!isFirstAdmin) {
      showAlert('최초 관리자만 관리자를 해제할 수 있습니다.');
      return;
    }
    
    if (await showConfirm('이 관리자를 일반 멤버로 강등시키겠습니까?')) {
      const success = storage.demoteToMember(userId);
      if (success) {
        showAlert('관리자가 일반 멤버로 강등되었습니다.');
        loadDashboardData();
      } else {
        showAlert('강등 처리에 실패했습니다. (최초 관리자는 강등할 수 없습니다)');
      }
    }
  };


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

  const formatDate = (dateString) => {
    if (!dateString) return '날짜 없음';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const filterUsersByGender = (users) => {
    if (genderFilter === 'all') return users;
    return users.filter(user => user.profile?.gender === genderFilter);
  };

  const filterUsersByAge = (users) => {
    if (ageFilter === 'all') return users;
    return users.filter(user => {
      const age = getAge(user);
      const ageGroup = getAgeGroup(age);
      return ageGroup === ageFilter;
    });
  };

  const applyAllFilters = (users) => {
    let filtered = filterUsersByGender(users);
    filtered = filterUsersByAge(filtered);
    return filtered;
  };

  const renderFilters = () => {
    if (activeTab === 'overview') return null;
    
    return (
      <UserFilters 
        genderFilter={genderFilter}
        setGenderFilter={setGenderFilter}
        ageFilter={ageFilter}
        setAgeFilter={setAgeFilter}
      />
    );
  };

  // 페이지 변경 핸들러
  const handlePageChange = (tabName, newPage) => {
    setCurrentPages(prev => ({
      ...prev,
      [tabName]: newPage
    }));
  };


  const getDateRangeUsers = (days) => {
    const allUsers = storage.getAllUsers();
    const currentDate = new Date();
    const targetDate = new Date(currentDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    return allUsers.filter(user => {
      if (!user.createdAt) return false;
      const userDate = new Date(user.createdAt);
      return userDate >= targetDate && userDate <= currentDate;
    });
  };

  const userAnalytics = UserAnalytics({
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
  });

  const renderTabContent = () => {
    const allUsers = storage.getAllUsers();
    const activeUsers = storage.getActiveUsers();
    const deletedUsers = storage.getDeletedUsers();
    const adminUsers = activeUsers.filter(user => user.role === 'ADMIN');
    const memberUsers = activeUsers.filter(user => user.role === 'MEMBER');

    switch (activeTab) {
      case 'total':
        const filteredAllUsers = applyAllFilters(allUsers);
        const totalColumns = [
          { key: 'username', label: '사용자명' },
          { key: 'id', label: '아이디' },
          { key: 'gender', label: '성별' },
          { key: 'ageGroup', label: '연령대' },
          { key: 'role', label: '권한' },
          { key: 'status', label: '상태' },
          { key: 'createdAt', label: '가입일' }
        ];
        return (
          <div className="tab-data">
            {renderFilters()}
            <UserTable
              users={filteredAllUsers}
              columns={totalColumns}
              currentPage={currentPages.total}
              itemsPerPage={5}
              onPageChange={(page) => handlePageChange('total', page)}
              title="전체 사용자 목록"
            />
          </div>
        );

      case 'active':
        const filteredActiveUsers = applyAllFilters(activeUsers);
        const activeColumns = [
          { key: 'username', label: '사용자명' },
          { key: 'id', label: '아이디' },
          { key: 'gender', label: '성별' },
          { key: 'ageGroup', label: '연령대' },
          { key: 'role', label: '권한' },
          { key: 'createdAt', label: '가입일' },
          { key: 'actions', label: '권한 관리' }
        ];
        const activeActions = (user) => (
          <div>
            {isFirstAdmin && user.role === 'MEMBER' && (
              <button onClick={() => handlePromoteUser(user.id)} className="btn-promote-small">관리자 승격</button>
            )}
            {isFirstAdmin && user.role === 'ADMIN' && !user.auth?.isFirstAdmin && (
              <button onClick={() => handleDemoteUser(user.id)} className="btn-demote">관리자 해제</button>
            )}
          </div>
        );
        return (
          <div className="tab-data">
            {renderFilters()}
            <UserTable
              users={filteredActiveUsers}
              columns={activeColumns}
              currentPage={currentPages.active}
              itemsPerPage={5}
              onPageChange={(page) => handlePageChange('active', page)}
              title="관리자 권한 관리 목록"
              actions={activeActions}
            />
          </div>
        );

      case 'deleted':
        const deletedColumns = [
          { key: 'username', label: '사용자명' },
          { key: 'id', label: '아이디' },
          { key: 'role', label: '권한' },
          { key: 'createdAt', label: '가입일' },
          { key: 'deletedAt', label: '삭제일' }
        ];
        return (
          <div className="tab-data">
            <UserTable
              users={deletedUsers}
              columns={deletedColumns}
              currentPage={currentPages.deleted}
              itemsPerPage={5}
              onPageChange={(page) => handlePageChange('deleted', page)}
              title="삭제된 계정 목록"
            />
          </div>
        );

      case 'today':
        return (
          <div className="tab-data">
            <h3>가입자 분석</h3>
            {userAnalytics.renderTodaySubTabs()}
            {userAnalytics.renderTodaySubContent()}
          </div>
        );

      case 'admins':
        const filteredAdminUsers = applyAllFilters(adminUsers);
        const adminColumns = [
          { key: 'username', label: '사용자명' },
          { key: 'id', label: '아이디' },
          { key: 'gender', label: '성별' },
          { key: 'ageGroup', label: '연령대' },
          { key: 'email', label: '이메일' },
          { key: 'createdAt', label: '가입일' },
          { key: 'isFirstAdmin', label: '최초 관리자' }
        ];
        return (
          <div className="tab-data">
            {renderFilters()}
            <UserTable
              users={filteredAdminUsers}
              columns={adminColumns}
              currentPage={currentPages.admins}
              itemsPerPage={5}
              onPageChange={(page) => handlePageChange('admins', page)}
              title="관리자 계정 목록"
            />
          </div>
        );

      case 'members':
        const filteredMemberUsers = applyAllFilters(memberUsers);
        const memberColumns = [
          { key: 'username', label: '사용자명' },
          { key: 'id', label: '아이디' },
          { key: 'gender', label: '성별' },
          { key: 'ageGroup', label: '연령대' },
          { key: 'status', label: '상태' },
          { key: 'email', label: '이메일' },
          { key: 'createdAt', label: '가입일' }
        ];
        return (
          <div className="tab-data">
            {renderFilters()}
            <UserTable
              users={filteredMemberUsers}
              columns={memberColumns}
              currentPage={currentPages.members}
              itemsPerPage={5}
              onPageChange={(page) => handlePageChange('members', page)}
              title="멤버 계정 목록"
            />
          </div>
        );

      case 'charts':
        return userAnalytics.renderChartsTab();  

      case 'pending':
        const pendingColumns = [
          { key: 'username', label: '사용자명' },
          { key: 'id', label: '아이디' },
          { key: 'status', label: '상태' },
          { key: 'email', label: '이메일' },
          { key: 'createdAt', label: '가입일' }
        ];
        return (
          <div className="tab-data">
            <UserTable
              users={pendingUsers}
              columns={pendingColumns}
              currentPage={currentPages.pending}
              itemsPerPage={5}
              onPageChange={(page) => handlePageChange('pending', page)}
              title="승인 대기 사용자"
            />
          </div>
        );

      default:
        return (
          <div className="tab-data">
            <div className="dashboard-overview">
              <div className="overview-section">
                <h3>권한별 사용자 분포</h3>
                <div className="role-distribution">
                  <div className="role-item">
                    <span className="role-label">ADMIN</span>
                    <span className="role-count">{stats.roleDistribution.ADMIN}</span>
                  </div>
                  <div className="role-item">
                    <span className="role-label">MEMBER</span>
                    <span className="role-count">{stats.roleDistribution.MEMBER}</span>
                  </div>
                </div>
              </div>
              
              <div className="overview-section">
                <h3>최근 가입 사용자</h3>
                <div className="recent-users-list">
                  {recentUsers.slice(0, 5).map(user => (
                    <div key={user.userKey} className="recent-user-item">
                      <span className="user-name">{user.profile?.username || user.id}</span>
                      <span className={`role-badge role-${user.role.toLowerCase()}`}>{user.role}</span>
                      <span className="user-date">{formatDate(user.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };



  return (
    <div className="admin-dashboard">
      <h1>관리자 대시보드</h1>
      
      <DashboardStats 
        stats={stats}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="tab-content">
        {renderTabContent()}
      </div>


      <div className="dashboard-actions">
        <button onClick={loadDashboardData} className="refresh-btn">
          데이터 새로고침
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;