import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGuestPolicy } from '../src/utils/guestPolicy.mjs';

function store(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    get(key, type = 'local') { return structuredClone(data.get(`${type}:${key}`) ?? null); },
    set(key, value, type = 'local') { data.set(`${type}:${key}`, structuredClone(value)); },
    remove(key, type = 'local') { data.delete(`${type}:${key}`); },
  };
}

test('three successful saves across different features are allowed; fourth write is never called', () => {
  const db = store();
  const policy = createGuestPolicy(db);
  for (const key of ['dietRecords', 'exerciseRecords', 'weightRecords']) {
    assert.equal(policy.save('guest', () => db.set(key, { guest: [{ date: '2026-10-02' }] })), true);
  }
  assert.equal(policy.count(), 3);
  let wrote = false;
  assert.equal(policy.save('guest', () => { wrote = true; }), false);
  assert.equal(wrote, false);
  db.remove('totalGuestSaves', 'session');
  assert.equal(createGuestPolicy(db).count(), 3);
});

test('invalid writes do not consume trials; edits count and deletion does not replenish the quota', () => {
  const db = store();
  const policy = createGuestPolicy(db);
  assert.throws(() => policy.save('guest', () => { throw new Error('Invalid'); }));
  assert.equal(policy.count(), 0);
  for (let weight = 70; weight < 73; weight++) {
    assert.equal(policy.save('guest', () => db.set('weightRecords', { guest: [{ weight }] })), true);
  }
  db.set('weightRecords', { guest: [] });
  assert.equal(policy.count(), 3);
  assert.equal(policy.save('guest', () => {}), false);
});

test('login transfers all trial records, preserves member records, and removes the limit', () => {
  const db = store({
    'local:dietRecords': { guest: [{ id: 'diet' }], member: [{ id: 'existing' }] },
    'session:dietRecords': [{ id: 'session-diet' }],
    'local:exerciseRecords': { guest: [{ id: 'exercise' }] },
    'local:weightRecords': { guest: [{ date: '2026-10-02', weight: 71 }], member: [{ date: '2026-10-01', weight: 70 }, { date: '2026-10-02', weight: 72 }] },
    'session:totalGuestSaves': 3,
    'local:userGoals': { guest: [{ goalWeight: 65 }], member: [{ goalWeight: 66 }] },
  });
  const policy = createGuestPolicy(db);
  assert.equal(policy.migrate('member'), 4);
  assert.deepEqual(db.get('dietRecords').member.map(record => record.id), ['existing', 'diet', 'session-diet']);
  assert.equal(db.get('dietRecords').guest, undefined);
  assert.equal(db.get('exerciseRecords').member[0].id, 'exercise');
  assert.deepEqual(db.get('weightRecords').member, [{ date: '2026-10-01', weight: 70 }, { date: '2026-10-02', weight: 71 }]);
  assert.equal(db.get('userGoals').member.length, 2);
  assert.equal(db.get('userGoals').guest, undefined);
  assert.equal(policy.migrate('member'), 0);
  for (let n = 0; n < 10; n++) assert.equal(policy.save('member', () => {}), true);
});
