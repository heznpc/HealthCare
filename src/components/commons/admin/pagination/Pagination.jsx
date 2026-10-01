import React from 'react';
import './Pagination.css';

const Pagination = ({ 
  currentPage, 
  totalItems, 
  itemsPerPage = 5, 
  onPageChange,
  maxVisiblePages = 5
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) return null;
  
  const getVisiblePages = () => {
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };
  
  const visiblePages = getVisiblePages();
  const showFirstLast = totalPages > maxVisiblePages;
  
  return (
    <div className="pagination">
      <div className="pagination-info">
        전체 {totalItems}개 중 {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)}개 표시
      </div>
      
      <div className="pagination-controls">
        {/* 첫 페이지로 */}
        {showFirstLast && currentPage > 1 && (
          <button
            onClick={() => onPageChange(1)}
            className="pagination-btn first"
            title="첫 페이지"
          >
            ≪
          </button>
        )}
        
        {/* 이전 페이지 */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-btn prev"
          title="이전 페이지"
        >
          ‹
        </button>
        
        {/* 페이지 번호들 */}
        {visiblePages.map(pageNum => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
          >
            {pageNum}
          </button>
        ))}
        
        {/* 다음 페이지 */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-btn next"
          title="다음 페이지"
        >
          ›
        </button>
        
        {/* 마지막 페이지로 */}
        {showFirstLast && currentPage < totalPages && (
          <button
            onClick={() => onPageChange(totalPages)}
            className="pagination-btn last"
            title="마지막 페이지"
          >
            ≫
          </button>
        )}
      </div>
    </div>
  );
};

export default Pagination;