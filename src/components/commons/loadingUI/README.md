# Skeleton Loading UI

간단하고 재사용 가능한 스켈레톤 로딩 컴포넌트입니다.

## 기본 사용법

```jsx
import { Skeleton } from 'components/commons/loadingUI';

// 카드 1개 (단일)
<Skeleton />

// 카드 3개 (그리드)
<Skeleton count={3} />

// 카드 6개 (2x3 그리드)
<Skeleton count={6} columns={2} />
```

## Props

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `count` | number | 1 | 카드 개수 (1개면 단일, 2개 이상이면 그리드) |
| `columns` | number | 3 | 그리드 컬럼 수 (count > 1일 때만 적용) |
| `gap` | string | "14px" | 카드 간격 |
| `hasImage` | boolean | true | 이미지 영역 표시 여부 |
| `imageAspectRatio` | string | "1 / 1" | 이미지 비율 |
| `bodyLines` | number | 3 | 텍스트 라인 개수 |
| `className` | string | "" | 추가 CSS 클래스 |

## 사용 예제

### 로딩 상태 처리
```jsx
{loading ? (
  <Skeleton count={3} />  // 로딩 중
) : (
  <div>실제 데이터</div>  // 데이터 로드 완료
)}
```

### 다양한 레이아웃
```jsx
// 단일 카드
<Skeleton />

// 3개 카드를 한 줄에
<Skeleton count={3} />

// 6개 카드를 2열로
<Skeleton count={6} columns={2} />

// 리스트형 (이미지 없음)
<Skeleton count={5} columns={1} hasImage={false} bodyLines={2} />

// 와이드 이미지 (16:9 비율)
<Skeleton count={4} imageAspectRatio="16 / 9" />
```