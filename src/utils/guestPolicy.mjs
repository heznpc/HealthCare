export const GUEST_SAVE_LIMIT = 3;
export const GUEST_LIMIT_MESSAGE = '비로그인 저장은 총 3회까지 가능합니다. 로그인하면 제한 없이 기록을 이어갈 수 있습니다.';
const RECORD_KEYS = ['dietRecords', 'exerciseRecords', 'weightRecords'];

export function createGuestPolicy(store) {
  const guestRecords = key => {
    const value = store.get(key);
    return Array.isArray(value) ? value : value?.guest || [];
  };
  function count() {
    const saved = store.get('totalGuestSaves') ?? store.get('totalGuestSaves', 'session');
    if (saved !== null && Number.isFinite(Number(saved)) && Number(saved) >= 0) return Math.floor(Number(saved));
    // Existing trials already contain records, even if the old hook was unused.
    const sessionDiet = store.get('dietRecords', 'session');
    return RECORD_KEYS.reduce((total, key) => total + guestRecords(key).length, 0)
      + (Array.isArray(sessionDiet) ? sessionDiet.length : 0);
  }
  function save(userKey, write) {
    const guest = !userKey || userKey === 'guest';
    if (!guest) { write(); return true; }
    const used = count();
    if (guest && used >= GUEST_SAVE_LIMIT) return false;
    write();
    if (guest) store.set('totalGuestSaves', used + 1);
    return true;
  }
  function migrate(userKey) {
    if (!userKey || userKey === 'guest') return 0;
    let migrated = 0;
    for (const key of RECORD_KEYS) {
      const raw = store.get(key) || {};
      const all = Array.isArray(raw) ? {} : { ...raw };
      const guests = [...guestRecords(key)];
      if (key === 'dietRecords') {
        const sessionDiet = store.get(key, 'session');
        if (Array.isArray(sessionDiet)) guests.push(...sessionDiet);
      }
      if (guests.length) {
        const merged = [...(all[userKey] || [])];
        const seen = new Set(merged.map(record => JSON.stringify(record)));
        for (const record of guests) {
          const identity = JSON.stringify(record);
          if (!seen.has(identity)) { merged.push(record); seen.add(identity); migrated++; }
        }
        // A weight record is an editable daily value; the latest trial value wins.
        all[userKey] = key === 'weightRecords'
          ? [...new Map(merged.map(record => [record.date, record])).values()]
          : merged;
        delete all.guest;
        store.set(key, all);
      }
      if (key === 'dietRecords') store.remove(key, 'session');
    }
    for (const key of ['userGoals', 'userGoal']) {
      const all = store.get(key);
      if (all?.guest) {
        store.set(key, { ...all, [userKey]: [...(all[userKey] || []), ...all.guest] });
        const next = store.get(key);
        delete next.guest;
        store.set(key, next);
      }
    }
    const tabs = store.get('dietMealTabs::guest') || store.get('dietMealTabs', 'session');
    if (tabs) {
      const existing = store.get(`dietMealTabs::${userKey}`) || [];
      store.set(`dietMealTabs::${userKey}`, [...new Set([...existing, ...tabs])]);
      store.remove('dietMealTabs::guest');
      store.remove('dietMealTabs', 'session');
    }
    store.remove('totalGuestSaves');
    store.remove('totalGuestSaves', 'session');
    return migrated;
  }
  return { count, save, migrate };
}
