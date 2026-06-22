import store, { getEffectiveRole, getActiveDraft, getResponsibleUsers, persistDrafts } from './store';
import type { CatalogNode, EntityDetail, EntityType, UserRole } from '../types';

function buildServiceNodes(projectId: string, userId: string): CatalogNode[] {
  return store.services
    .filter(s => s.projectId === projectId)
    .map(s => {
      const role = getEffectiveRole(userId, 'service', s.id);
      const activeDraft = getActiveDraft('service', s.id);
      return {
        type: 'service' as EntityType,
        id: s.id,
        name: s.name,
        displayName: s.displayName,
        description: s.description,
        effectiveRole: role,
        activeDraftId: activeDraft?.id,
        config: role ? { ...s.config } : undefined,
        children: undefined,
      } satisfies CatalogNode;
    });
}

function buildProjectNodes(projects: typeof store.projects, parentProjectId: string | undefined, namespaceId: string, userId: string): CatalogNode[] {
  return projects
    .filter(p => p.namespaceId === namespaceId && p.parentProjectId === parentProjectId)
    .map(p => {
      const role = getEffectiveRole(userId, 'project', p.id);
      const activeDraft = getActiveDraft('project', p.id);
      const subProjects = buildProjectNodes(projects, p.id, namespaceId, userId);
      const services = buildServiceNodes(p.id, userId);
      return {
        type: 'project' as EntityType,
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        description: p.description,
        effectiveRole: role,
        activeDraftId: activeDraft?.id,
        children: [...subProjects, ...services],
      } satisfies CatalogNode;
    });
}

export function mockGetCatalogTree(userId: string): CatalogNode[] {
  return store.namespaces.map(ns => {
    const role = getEffectiveRole(userId, 'namespace', ns.id);
    const activeDraft = getActiveDraft('namespace', ns.id);
    const projects = buildProjectNodes(store.projects, undefined, ns.id, userId);
    return {
      type: 'namespace' as EntityType,
      id: ns.id,
      name: ns.name,
      displayName: ns.displayName,
      description: ns.description,
      effectiveRole: role,
      activeDraftId: activeDraft?.id,
      children: projects,
    } satisfies CatalogNode;
  });
}

export function mockGetEntityDetail(userId: string, entityType: EntityType, entityId: string): EntityDetail | null {
  const role = getEffectiveRole(userId, entityType, entityId);
  const responsibleUsers = getResponsibleUsers(entityType, entityId);
  const activeDraft = getActiveDraft(entityType, entityId);

  if (entityType === 'namespace') {
    const ns = store.namespaces.find(n => n.id === entityId);
    if (!ns) return null;
    return { type: 'namespace', id: ns.id, name: ns.name, displayName: ns.displayName, description: ns.description, effectiveRole: role, responsibleUsers, activeDraft };
  }
  if (entityType === 'project') {
    const prj = store.projects.find(p => p.id === entityId);
    if (!prj) return null;
    return { type: 'project', id: prj.id, name: prj.name, displayName: prj.displayName, description: prj.description, effectiveRole: role, responsibleUsers, activeDraft };
  }
  if (entityType === 'service') {
    const svc = store.services.find(s => s.id === entityId);
    if (!svc) return null;
    return { type: 'service', id: svc.id, name: svc.name, displayName: svc.displayName, description: svc.description, effectiveRole: role, responsibleUsers, activeDraft, config: role ? { ...svc.config } : undefined };
  }
  return null;
}

export function mockSaveConfig(userId: string, entityType: EntityType, entityId: string, newConfig: Record<string, unknown>): { ok: boolean; draftId?: string; error?: string } {
  const role = getEffectiveRole(userId, entityType, entityId);
  if (!role || role === 'read') return { ok: false, error: 'Недостаточно прав для редактирования конфига' };

  const existing = getActiveDraft(entityType, entityId);
  if (existing) return { ok: false, error: 'У сущности уже есть активный черновик' };

  let configBefore: Record<string, unknown> = {};
  let entityName = '';

  if (entityType === 'service') {
    const svc = store.services.find(s => s.id === entityId);
    if (!svc) return { ok: false, error: 'Сервис не найден' };
    configBefore = { ...svc.config };
    entityName = svc.displayName;
  }

  const responsibleUsers = getResponsibleUsers(entityType, entityId);
  const approverIds = responsibleUsers.map(u => u.id);

  const draft = {
    id: `draft-${Date.now()}`,
    entityType,
    entityId,
    entityName,
    configBefore,
    configAfter: { ...newConfig },
    authorId: userId,
    createdAt: new Date().toISOString(),
    status: 'created' as const,
    approverIds,
  };

  store.drafts.unshift(draft);
  persistDrafts();
  return { ok: true, draftId: draft.id };
}

export function mockGetUserRoleAssignments(userId: string): Array<{ entityType: EntityType; entityId: string; entityName: string; role: UserRole }> {
  const userRoles = store.roles.filter(r => r.userId === userId);
  return userRoles.map(r => {
    let entityName = r.entityId;
    if (r.entityType === 'namespace') {
      entityName = store.namespaces.find(n => n.id === r.entityId)?.displayName ?? r.entityId;
    } else if (r.entityType === 'project') {
      entityName = store.projects.find(p => p.id === r.entityId)?.displayName ?? r.entityId;
    } else if (r.entityType === 'service') {
      entityName = store.services.find(s => s.id === r.entityId)?.displayName ?? r.entityId;
    }
    return { entityType: r.entityType, entityId: r.entityId, entityName, role: r.role };
  });
}

export function mockGetStats(userId: string): { namespaces: number; services: number; activeDrafts: number } {
  const activeDrafts = store.drafts.filter(d => {
    if (d.status !== 'created') return false;
    return d.authorId === userId || getEffectiveRole(userId, d.entityType, d.entityId) !== null;
  }).length;
  return {
    namespaces: store.namespaces.length,
    services: store.services.length,
    activeDrafts,
  };
}
