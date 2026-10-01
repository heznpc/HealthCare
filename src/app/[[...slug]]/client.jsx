'use client';

import dynamic from 'next/dynamic';

const Application = dynamic(() => import('../../StorageApp'), {
  ssr: false,
  loading: () => <p role="status">앱을 불러오는 중입니다…</p>,
});

export default function ClientApp() {
  return <Application />;
}
