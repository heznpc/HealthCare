import { storage } from './storage';

export const fmtLocal = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const getUserKey = () => {
  const raw = storage.get('user', 'session');
  if (!raw) return null;
  try {
    return raw.username || raw.id || raw;
  } catch {
    return raw;
  }
};
