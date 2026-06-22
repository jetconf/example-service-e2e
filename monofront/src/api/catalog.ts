import type { CatalogNode, EntityDetail, EntityType, UserRole } from '../types';

const BASE = '/api/v1';

export async function apiGetCatalogTree(userId: string): Promise<CatalogNode[]> {
  const res = await fetch(`${BASE}/catalog/tree?userId=${userId}`, { credentials: 'include' });
  return res.json();
}

export async function apiGetEntityDetail(userId: string, entityType: EntityType, entityId: string): Promise<EntityDetail | null> {
  const res = await fetch(`${BASE}/catalog/${entityType}/${entityId}?userId=${userId}`, { credentials: 'include' });
  if (!res.ok) return null;
  return res.json();
}

export async function apiSaveConfig(userId: string, entityType: EntityType, entityId: string, config: Record<string, unknown>): Promise<{ ok: boolean; draftId?: string; error?: string }> {
  const res = await fetch(`${BASE}/catalog/${entityType}/${entityId}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId, config }),
  });
  return res.json();
}

export async function apiGetUserRoleAssignments(userId: string): Promise<Array<{ entityType: EntityType; entityId: string; entityName: string; role: UserRole }>> {
  const res = await fetch(`${BASE}/catalog/roles?userId=${userId}`, { credentials: 'include' });
  const data = await res.json();
  return data ?? [];
}

export async function apiGetStats(userId: string): Promise<{ namespaces: number; services: number; activeDrafts: number }> {
  const res = await fetch(`${BASE}/stats?userId=${userId}`, { credentials: 'include' });
  return res.json();
}
