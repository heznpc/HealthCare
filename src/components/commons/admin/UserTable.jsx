import React from 'react';
import Pagination from './pagination/Pagination';
import './css/UserTable.css';

const UserTable = ({ 
  users, 
  columns, 
  currentPage,
  itemsPerPage = 5,
  onPageChange,
  title,
  actions
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = users.slice(startIndex, endIndex);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return '날짜 없음';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getUserStatus = (user) => {
    if (user.auth?.isDeleted) return '삭제됨';
    if (user.status === 'PENDING') return '승인 대기';
    if (user.status === 'REJECTED') return '승인 거절';
    return '승인 완료';
  };

  const getStatusClass = (user) => {
    if (user.auth?.isDeleted) return 'status-deleted';
    if (user.status === 'PENDING') return 'status-pending';
    if (user.status === 'REJECTED') return 'status-rejected';
    return 'status-active';
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

  const renderCellContent = (column, user) => {
    switch (column.key) {
      case 'username':
        return user.profile?.username || user.id;
      case 'id':
        return user.id;
      case 'gender':
        return (
          <span className={`gender-badge gender-${user.profile?.gender || 'unknown'}`}>
            {user.profile?.gender === 'male' ? '남성' : 
              user.profile?.gender === 'female' ? '여성' : '미설정'}
          </span>
        );
      case 'ageGroup':
        const age = getAge(user);
        const ageGroup = getAgeGroup(age);
        return (
          <span className={`age-badge age-${ageGroup}`}>
            {getAgeGroupLabel(ageGroup)}
          </span>
        );
      case 'age':
        return user.profile?.age || '미설정';
      case 'role':
        return <span className={`role-badge role-${user.role.toLowerCase()}`}>{user.role}</span>;
      case 'status':
        if (user.id === 'admin') {
          return <span className="status-badge admin-badge"></span>;
        }
        return (
          <span className={`status-badge ${getStatusClass(user)}`}>
            {getUserStatus(user)}
          </span>
        );
      case 'email':
        return user.profile?.email || '이메일 없음';
      case 'createdAt':
        return formatDate(user.createdAt);
      case 'deletedAt':
        return formatDate(user.auth?.deletedAt);
      case 'isFirstAdmin':
        return (
          <span className={`first-admin-badge ${user.auth?.isFirstAdmin ? 'is-first' : 'not-first'}`}>
            {user.auth?.isFirstAdmin ? '최초 관리자' : '일반 관리자'}
          </span>
        );
      case 'actions':
        return actions ? actions(user) : null;
      default:
        return user[column.key] || '';
    }
  };

  return (
    <div className="user-table-container">
      {title && <h3>{title} ({users.length}명)</h3>}
      <div className="users-table">
        <table>
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map(user => (
              <tr key={user.userKey}>
                {columns.map(column => (
                  <td key={column.key}>
                    {renderCellContent(column, user)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        <Pagination
          currentPage={currentPage}
          totalItems={users.length}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};

export default UserTable;