import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStorageRepository } from '../src/utils/indexedStore.mjs';

function legacy(values) {
  const entries = Object.entries(values);
  return { length: entries.length, key: i => entries[i]?.[0] ?? null, getItem: key => values[key] ?? null };
}

test('imports existing health/account data once, then persists edits and deletions across reloads', async () => {
  const name = `test-${crypto.randomUUID()}`;
  const legacyLocal = legacy({ users: '{"demo":{"id":"demo"}}', weightRecords: '{"guest":[{"weight":70}]}' });
  const first = createStorageRepository({ name, sessionId: 'a', legacyLocal });
  await first.initialize();
  assert.equal(JSON.parse(first.local.getItem('users')).demo.id, 'demo');
  first.local.setItem('weightRecords', '{"guest":[{"weight":71}]}');
  first.local.removeItem('users');
  await first.close();
  const second = createStorageRepository({ name, sessionId: 'a', legacyLocal });
  await second.initialize();
  assert.equal(second.local.getItem('users'), null);
  assert.equal(JSON.parse(second.local.getItem('weightRecords')).guest[0].weight, 71);
  await second.close();
});

test('session data survives reloads, remains isolated from other sessions and durable data', async () => {
  const name = `test-${crypto.randomUUID()}`;
  const first = createStorageRepository({ name, sessionId: 'a', legacySession: legacy({ dietRecords: '[]' }) });
  await first.initialize();
  first.session.setItem('dietRecords', '[{"calories":200}]');
  first.local.setItem('dietRecords', '{"member":[]}');
  await first.close();
  const reload = createStorageRepository({ name, sessionId: 'a' });
  await reload.initialize();
  assert.equal(JSON.parse(reload.session.getItem('dietRecords'))[0].calories, 200);
  await reload.close();
  const other = createStorageRepository({ name, sessionId: 'b' });
  await other.initialize();
  assert.equal(other.session.getItem('dietRecords'), null);
  assert.deepEqual(JSON.parse(other.local.getItem('dietRecords')), { member: [] });
  await other.close();
});

test('each existing browser session imports its own legacy data independently', async () => {
  const name = `test-${crypto.randomUUID()}`;
  const first = createStorageRepository({ name, sessionId: 'a', legacySession: legacy({ tabs: 'breakfast' }) });
  await first.initialize();
  await first.close();
  const second = createStorageRepository({ name, sessionId: 'b', legacySession: legacy({ tabs: 'dinner' }) });
  await second.initialize();
  assert.equal(second.session.getItem('tabs'), 'dinner');
  second.session.removeItem('tabs');
  await second.close();
  const reload = createStorageRepository({ name, sessionId: 'b', legacySession: legacy({ tabs: 'dinner' }) });
  await reload.initialize();
  assert.equal(reload.session.getItem('tabs'), null);
  await reload.close();
});

test('ordered rapid writes, removal, and clear are committed before flush resolves', async () => {
  const repo = createStorageRepository({ name: `test-${crypto.randomUUID()}`, sessionId: 'a' });
  await repo.initialize();
  for (let n = 0; n < 50; n++) repo.local.setItem('counter', String(n));
  repo.local.setItem('temporary', 'x');
  repo.local.removeItem('temporary');
  await repo.flush();
  assert.equal(repo.local.getItem('counter'), '49');
  assert.equal(repo.local.getItem('temporary'), null);
  repo.local.clear();
  await repo.flush();
  assert.equal(repo.local.length, 0);
  assert.equal(repo.state().pending, 0);
  await repo.close();
});

test('failed transactions retain queued changes and retry commits them', async () => {
  const name = `test-${crypto.randomUUID()}`;
  const repo = createStorageRepository({ name, sessionId: 'a' });
  await repo.initialize();
  const original = IDBDatabase.prototype.transaction;
  try {
    IDBDatabase.prototype.transaction = function (...args) {
      if (args[0] === 'entries' && args[1] === 'readwrite') {
        throw new DOMException('Storage is full', 'QuotaExceededError');
      }
      return original.apply(this, args);
    };
    repo.local.setItem('weightRecords', '{"guest":[{"weight":72}]}');
    await assert.rejects(repo.flush(), { name: 'QuotaExceededError' });
    assert.equal(repo.state().pending, 1);
    assert.equal(repo.state().error.name, 'QuotaExceededError');
  } finally {
    IDBDatabase.prototype.transaction = original;
  }
  await repo.retry();
  assert.equal(repo.state().pending, 0);
  assert.equal(repo.state().error, null);
  await repo.close();
  const reload = createStorageRepository({ name, sessionId: 'a' });
  await reload.initialize();
  assert.equal(JSON.parse(reload.local.getItem('weightRecords')).guest[0].weight, 72);
  await reload.close();
});
