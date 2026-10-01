import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { guestPolicy } from '../../utils/guestStorage';
import { GUEST_SAVE_LIMIT } from '../../utils/guestPolicy.mjs';

export default function GuestNotice() {
  const [used, setUsed] = useState(() => guestPolicy.count());
  useEffect(() => {
    const update = () => setUsed(guestPolicy.count());
    window.addEventListener('healthcare-storage-status', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('healthcare-storage-status', update);
      window.removeEventListener('storage', update);
    };
  }, []);
  return <p role="status">
    로그인 없이 식단·운동·체중을 합쳐 {GUEST_SAVE_LIMIT}회 저장할 수 있습니다. ({Math.min(used, GUEST_SAVE_LIMIT)}/{GUEST_SAVE_LIMIT}회 사용)
    {' '}<Link to="/login">로그인</Link>하면 제한이 풀리고 체험 기록이 이어집니다.
  </p>;
}
