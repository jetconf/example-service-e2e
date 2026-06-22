import type { Draft } from '../types';

const BASE = '/api/v1';

export async function apiGetDrafts(userId: string): Promise<Draft[]> {
  const res = await fetch(`${BASE}/drafts?userId=${userId}`, { credentials: 'include' });
  const data = await res.json();
  return data ?? [];
}

export async function apiApproveDraft(userId: string, draftId: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${BASE}/drafts/${draftId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

export async function apiCancelDraft(userId: string, draftId: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${BASE}/drafts/${draftId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId }),
  });
  return res.json();
}
