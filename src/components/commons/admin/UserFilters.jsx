import React from 'react';
import './css/UserFilters.css';

const UserFilters = ({ genderFilter, setGenderFilter, ageFilter, setAgeFilter }) => {
  return (
    <div className="filters-container">
      <div className="filter-group">
        <label htmlFor="gender-select">성별 필터:</label>
        <select 
          id="gender-select"
          value={genderFilter} 
          onChange={(e) => setGenderFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">전체</option>
          <option value="male">남성</option>
          <option value="female">여성</option>
        </select>
      </div>
      
      <div className="filter-group">
        <label htmlFor="age-select">연령대 필터:</label>
        <select 
          id="age-select"
          value={ageFilter} 
          onChange={(e) => setAgeFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">전체</option>
          <option value="10s">10대</option>
          <option value="20s">20대</option>
          <option value="30s">30대</option>
          <option value="40s">40대</option>
          <option value="50s">50대</option>
          <option value="60plus">60대 이상</option>
        </select>
      </div>
    </div>
  );
};

export default UserFilters;