import { GUEST_SAVE_LIMIT } from 'utils/guestPolicy.mjs';

export default function GuestManagement() {
  return (
    <section>
      <h2>비로그인 체험 정책</h2>
      <p>식단·운동·체중 기록을 합쳐 총 {GUEST_SAVE_LIMIT}회 저장할 수 있습니다.</p>
      <p>로그인하면 저장 제한이 풀리고 체험 기록이 회원 계정으로 이전됩니다.</p>
      <p>기록 수정도 저장 횟수에 포함하며, 삭제해도 사용 횟수는 복구되지 않습니다.</p>
    </section>
  );
}
