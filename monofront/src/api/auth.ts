import type { User } from '../types';

const BASE = '/api/v1';

export async function apiLogin(login: string, password: string): Promise<{ ok: boolean; user?: User; error?: string }> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ login, password }),
  });
  return res.json();
}

export async function apiLogout(): Promise<void> {
  await fetch(`${BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
}

export async function apiGetCurrentUser(): Promise<User | null> {
  const res = await fetch(`${BASE}/auth/me`, { credentials: 'include' });
  return res.json();
}
