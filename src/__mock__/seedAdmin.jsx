// src/data/seedAdmin.jsx
import { storage } from "../utils/storage";

export function seedAdmin() {
  // 이미 있으면 false 반환
  const exists = storage.getUserById("admin");
  if (exists) return false;

  // 새로 생성
  storage.upsertUser({
    id: "admin",
    role: "ADMIN",
    auth: { passwordHash: storage.hashPassword("admin123!") },
    profile: { username: "관리자", email: "admin@example.com" },
    createdAt: new Date().toISOString(),
  });
  return true; // 생성됨
}

export default seedAdmin;
