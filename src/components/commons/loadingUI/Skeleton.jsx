import React from 'react';
import './Skeleton.css';

const Skeleton = ({ 
  count = 1,                    // 카드 개수 (1개면 단일, 2개 이상이면 그리드)
  columns = 3,                  // 그리드 컬럼 수 (count가 1보다 클 때만 적용)
  gap = "14px",                // 카드 간격
  hasImage = true,             // 이미지 영역 표시 여부
  imageAspectRatio = "1 / 1",  // 이미지 비율
  bodyLines = 3,               // 텍스트 라인 개수
  className = ""               // 추가 CSS 클래스
}) => {
  // 단일 카드 컴포넌트
  const SkeletonCard = ({ index }) => (
    <div className="skeleton-card">
      {hasImage && (
        <div 
          className="skeleton-img skeleton" 
          style={{ aspectRatio: imageAspectRatio }}
        />
      )}
      <div className="skeleton-body">
        {Array.from({ length: bodyLines }, (_, lineIndex) => (
          <div 
            key={lineIndex} 
            className="skeleton-line skeleton" 
            style={{ 
              width: lineIndex === bodyLines - 1 ? '75%' : '90%'
            }} 
          />
        ))}
      </div>
    </div>
  );

  // 카드 1개면 단일로, 여러 개면 그리드로
  if (count === 1) {
    return (
      <div className={className}>
        <SkeletonCard index={0} />
      </div>
    );
  }

  return (
    <div 
      className={`skeleton-grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: gap
      }}
    >
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} index={index} />
      ))}
    </div>
  );
};

export default Skeleton;