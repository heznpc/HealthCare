import Script from 'next/script';
import '../index.css';

export const metadata = {
  title: 'HealthCare',
  description: '식단·운동·체중을 기록하는 건강 관리 앱',
  icons: { icon: '/images/log.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
