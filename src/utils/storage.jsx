import { localData, sessionData, initializeStorage, flushStorage } from './indexedStore.mjs';

// utils/storage.js
export const storage = {
  initialize: initializeStorage,
  flush: flushStorage,
  get: (key, type = 'local') => {
    try {
      const src = type === 'session' ? sessionData : localData;
      const v = src.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },

  set: (key, value, type = 'local') => {
    const src = type === 'session' ? sessionData : localData;
    src.setItem(key, JSON.stringify(value));
  },

  remove: (key, type = 'local') => {
    const src = type === 'session' ? sessionData : localData;
    src.removeItem(key);
  },

  hashPassword: (password) => btoa(password),
  generateUserKey: () => `user_${crypto.randomUUID()}`,
  getUserDataKey: (id) => `userData_${id}`,
  getAuthDataKey: (id) => `authData_${id}`,

  // ---- 신규 통합 API ----
  upsertUser: (payload) => {
    const users = storage.get('users') || {};
    const idIndex = storage.get('userIdIndex') || {};
    const userKey = idIndex[payload.id] || storage.generateUserKey();

    users[userKey] = {
      id: payload.id,
      profile: payload.profile,
      auth: payload.auth,             // { passwordHash }
      role: payload.role,
      isDeleted: !!payload.isDeleted,
      createdAt: payload.createdAt || new Date().toISOString(),
      userKey
    };
    idIndex[payload.id] = userKey;

    storage.set('users', users);
    storage.set('userIdIndex', idIndex);
    return userKey;
  },

  getUserById: (id) => {
    const users = storage.get('users') || {};
    const idIndex = storage.get('userIdIndex') || {};
    const key = idIndex[id];
    const u = key ? users[key] : null;
    return u ? compatUser(u) : null;
  },

  getUserByKey: (userKey) => {
    const users = storage.get('users') || {};
    const u = users[userKey] || null;
    return u ? compatUser(u) : null;
  },

  listUsers: (includeDeleted = true) => {
    const users = storage.get('users') || {};
    const arr = Object.values(users).map(compatUser);
    return includeDeleted ? arr : arr.filter(u => !u.isDeleted);
  },

  // ✅ 레거시/호환 alias
  getAllUsers: () => storage.listUsers(true),
  getUsers: () => storage.listUsers(true),

  // ✅ 활성 사용자 집계 (기본 30일)
  getActiveUsers: (sinceDays = 30) => {
    const users = storage.listUsers(true);
    const cutoff = Date.now() - sinceDays * 24 * 60 * 60 * 1000;

    return users.filter(u => {
      const ts =
        Date.parse(u.lastLoginAt) ||
        Date.parse(u.profile?.lastLoginAt) ||
        Date.parse(u.auth?.lastLoginAt) ||
        Date.parse(u.createdAt);
      return Number.isFinite(ts) && ts >= cutoff;
    });
  },

  softDeleteUser: (userKey) => {
    const users = storage.get('users') || {};
    if (users[userKey]) {
      users[userKey].isDeleted = true;
      storage.set('users', users);
    }
  },

  restoreUser: (userKey) => {
    const users = storage.get('users') || {};
    if (users[userKey]) {
      users[userKey].isDeleted = false;
      storage.set('users', users);
    }
  },

  // ---- 삭제 사용자 전용 ----
  getDeletedUsers: () => {
    const users = storage.get('users') || {};
    return Object.values(users).filter(u => u.isDeleted).map(compatUser);
  },

  getDeletedUsersMap: () => {
    const users = storage.get('users') || {};
    return Object.fromEntries(
      Object.entries(users).filter(([_, u]) => u.isDeleted)
    );
  },

  markUserDeleted: (userKey) => {
    const users = storage.get('users') || {};
    if (!users[userKey]) return false;
    users[userKey].isDeleted = true;
    users[userKey].deletedAt = new Date().toISOString();
    storage.set('users', users);
    return true;
  },

  restoreDeletedUser: (userKey) => {
    const users = storage.get('users') || {};
    if (!users[userKey]) return false;
    users[userKey].isDeleted = false;
    delete users[userKey].deletedAt;
    storage.set('users', users);
    return true;
  },

  // ---- Admin 유틸 ----
  isFirstAdmin: () => {
    const users = storage.get('users') || {};
    // 삭제되지 않은 ADMIN이 하나도 없으면 true
    return !Object.values(users).some(u =>
      !u?.isDeleted && (
        u?.role === 'ADMIN' ||
        u?.auth?.role === 'ADMIN' ||
        u?.profile?.role === 'ADMIN'
      )
    );
  },

  // ---- 게스트 세션 ----
  getGuestData: () => storage.get('guestData', 'session') || {},
  setGuestData: (data) => storage.set('guestData', data, 'session'),
  clearGuestData: () => storage.remove('guestData', 'session'),

  // ---- 레거시 마이그레이션 ----
  migrateLegacyUsersIfNeeded: () => {
    // The early standalone login stored one flat user, before the keyed schema.
    const legacyUser = storage.get('user');
    if (legacyUser?.id && legacyUser.password && !storage.getUserById(legacyUser.id)) {
      const { password, confirmPassword, ...profile } = legacyUser;
      storage.upsertUser({
        id: legacyUser.id, profile,
        auth: { passwordHash: storage.hashPassword(password) },
        role: legacyUser.role === 'admin' ? 'ADMIN' : 'MEMBER',
      });
    }
    const v = storage.get('userSchemaVersion');
    if (v === 2) return;

    const users = storage.get('users') || {};
    const idIndex = storage.get('userIdIndex') || {};
    localData.keys().forEach((k) => {
      if (!k.startsWith('userData_')) return;
      const id = k.replace('userData_', '');
      const userData = storage.get(`userData_${id}`);
      const authData = storage.get(`authData_${id}`);
      if (!userData || !authData) return;

      const userKey = authData.userKey || userData?.profile?.userKey || storage.generateUserKey();
      users[userKey] = {
        id,
        profile: userData.profile,
        auth: { passwordHash: authData.password },
        role: authData.role,
        createdAt: userData.profile?.createdAt || new Date().toISOString(),
        isDeleted: false,
        userKey
      };
      idIndex[id] = userKey;
    });

    if (Object.keys(users).length > 0) {
      storage.set('users', users);
      storage.set('userIdIndex', idIndex);
    }
    storage.set('userSchemaVersion', 2);
  }
};

// 내부: 레거시 코드 호환을 위해 auth.isDeleted 미러링
function compatUser(u) {
  const copy = { ...u, auth: { ...(u.auth || {}) } };
  if (typeof copy.auth.isDeleted === 'undefined') {
    copy.auth.isDeleted = !!copy.isDeleted;
  }
  return copy;
}
