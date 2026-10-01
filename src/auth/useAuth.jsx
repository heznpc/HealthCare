// auth/useAuth.js
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { storage } from '../utils/storage';
import { USER_ROLES } from '../utils/constants';
import { guestPolicy } from '../utils/guestStorage';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = useCallback(() => {
    const currentAuth = storage.get('currentAuth'); // ← localData
    if (currentAuth) {
      setUser(currentAuth);
      setIsAuthenticated(true);
    } else {
      setUser({ role: USER_ROLES.GUEST });
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    storage.migrateLegacyUsersIfNeeded?.();
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async ({ id, password }) => {
    const record = storage.getUserById(id);
    if (!record) return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };

    const ok = record.auth?.passwordHash === storage.hashPassword(password);
    if (!ok) return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' };

    const prev = storage.get('currentAuth') || {};
    const loginUser = {
      ...prev,
      id: record.id,
      username: record.profile?.username,
      role: record.role,
      userKey: record.userKey,
    };

    const migrated = guestPolicy.migrate(record.userKey);
    storage.set('currentAuth', loginUser); // ← localData
    await storage.flush();
    setUser(loginUser);
    setIsAuthenticated(true);
    return { success: true, user: loginUser, migrated };
  };

  const logout = () => {
    storage.remove('currentAuth'); // ← localData
    setUser({ role: USER_ROLES.GUEST });
    setIsAuthenticated(false);
  };

  const register = async (formData, isAdminSignup = false) => {
    const role = isAdminSignup ? USER_ROLES.ADMIN : USER_ROLES.MEMBER;

    const userKey = storage.upsertUser({
      id: formData.id,
      profile: { ...formData, username: formData.username },
      auth: { passwordHash: storage.hashPassword(formData.password) },
      role,
      createdAt: new Date().toISOString(),
    });

    const rec = storage.getUserByKey(userKey);
    if (rec) {
      rec.profile = { ...(rec.profile || {}), userKey };
      const users = storage.get('users') || {};
      users[userKey] = rec;
      storage.set('users', users);
    }

    await storage.flush();
    return { success: true, userKey };
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, logout, register, checkAuthStatus }}
    >
      {children}
    </AuthContext.Provider>
  );
};
