import store from './store';
import type { User } from '../types';

const SESSION_KEY = 'configadmin_user_id';

export interface LoginResult {
  ok: boolean;
  user?: User;
  error?: string;
}

export function mockLogin(login: string, password: string): LoginResult {
  const user = store.users.find(u => u.login === login && u.password === password);
  if (!user) return { ok: false, error: 'Неверный логин или пароль' };
  store.currentUserId = user.id;
  localStorage.setItem(SESSION_KEY, user.id);
  return { ok: true, user };
}

export function mockLogout(): void {
  store.currentUserId = null;
  localStorage.removeItem(SESSION_KEY);
}

export function mockGetCurrentUser(): User | null {
  // Restore from localStorage on first call (page reload)
  if (!store.currentUserId) {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) store.currentUserId = saved;
  }
  if (!store.currentUserId) return null;
  return store.users.find(u => u.id === store.currentUserId) ?? null;
}
