import { GUEST_LIMIT_MESSAGE } from './guestPolicy.mjs';

let queue = [];
const listeners = new Set();
const publish = () => listeners.forEach(listener => listener());
export const subscribeDialogs = listener => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getDialog = () => queue[0] || null;

function enqueue(message, options) {
  return new Promise(resolve => {
    queue = [...queue, { message, ...options, resolve }];
    publish();
  });
}
export const showAlert = (message, options = {}) => enqueue(message, { title: '안내', ...options });
export const showPrompt = message => enqueue(message, { title: '입력', cancel: true, prompt: true });
export const showConfirm = message => enqueue(message, { title: '확인', cancel: true });
export const showGuestLimit = () => showAlert(GUEST_LIMIT_MESSAGE, {
  title: '체험 저장을 모두 사용하셨습니다',
  confirmLabel: '닫기', actionLabel: '로그인하기', actionHref: '/login',
});
export function closeDialog(confirmed) {
  const current = queue[0];
  if (!current) return;
  queue = queue.slice(1);
  current.resolve(current.prompt && confirmed === false ? null : confirmed);
  publish();
}
