import type { User, Namespace, Project, Service, RoleAssignment, Draft, EntityType, UserRole } from '../types';

interface StoreState {
  currentUserId: string | null;
  users: User[];
  namespaces: Namespace[];
  projects: Project[];
  services: Service[];
  roles: RoleAssignment[];
  drafts: Draft[];
}

const store: StoreState = {
  currentUserId: null,
  users: [],
  namespaces: [],
  projects: [],
  services: [],
  roles: [],
  drafts: [],
};

export default store;

// ─── Persistence ─────────────────────────────────────────────────────────────

async function saveData(name: string, data: unknown): Promise<void> {
  await fetch(`/api/data/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data, null, 2),
  });
}

export async function initStore(): Promise<void> {
  const [users, namespaces, projects, services, roles, drafts] = await Promise.all([
    fetch('/api/data/users').then(r => r.json()),
    fetch('/api/data/namespaces').then(r => r.json()),
    fetch('/api/data/projects').then(r => r.json()),
    fetch('/api/data/services').then(r => r.json()),
    fetch('/api/data/roles').then(r => r.json()),
    fetch('/api/data/drafts').then(r => r.json()),
  ]);
  store.users = users;
  store.namespaces = namespaces;
  store.projects = projects;
  store.services = services;
  store.roles = roles;
  store.drafts = drafts;
}

export async function persistDrafts(): Promise<void> {
  await saveData('drafts', store.drafts);
}

export async function persistServices(): Promise<void> {
  await saveData('services', store.services);
}

// ─── Role utilities ───────────────────────────────────────────────────────────

const ROLE_ORDER: Record<UserRole, number> = { read: 1, edit: 2, responsible: 3 };

function higher(a: UserRole | null, b: UserRole | null): UserRole | null {
  if (!a) return b;
  if (!b) return a;
  return ROLE_ORDER[a] >= ROLE_ORDER[b] ? a : b;
}

export function getEffectiveRole(userId: string, entityType: EntityType, entityId: string): UserRole | null {
  const userRoles = store.roles.filter(r => r.userId === userId);
  let max: UserRole | null = null;

  const direct = userRoles.find(r => r.entityType === entityType && r.entityId === entityId);
  if (direct) max = higher(max, direct.role);

  if (entityType === 'service') {
    const svc = store.services.find(s => s.id === entityId);
    if (svc) {
      let projectId: string | undefined = svc.projectId;
      while (projectId) {
        const pr = userRoles.find(r => r.entityType === 'project' && r.entityId === projectId);
        if (pr) max = higher(max, pr.role);
        const prj = store.projects.find(p => p.id === projectId);
        if (!prj) break;
        const ns = userRoles.find(r => r.entityType === 'namespace' && r.entityId === prj.namespaceId);
        if (ns) max = higher(max, ns.role);
        projectId = prj.parentProjectId;
      }
    }
  } else if (entityType === 'project') {
    const prj = store.projects.find(p => p.id === entityId);
    if (prj) {
      const ns = userRoles.find(r => r.entityType === 'namespace' && r.entityId === prj.namespaceId);
      if (ns) max = higher(max, ns.role);
      let parentId = prj.parentProjectId;
      while (parentId) {
        const pr = userRoles.find(r => r.entityType === 'project' && r.entityId === parentId);
        if (pr) max = higher(max, pr.role);
        const parent = store.projects.find(p => p.id === parentId);
        if (!parent) break;
        const pns = userRoles.find(r => r.entityType === 'namespace' && r.entityId === parent.namespaceId);
        if (pns) max = higher(max, pns.role);
        parentId = parent.parentProjectId;
      }
    }
  }

  return max;
}

export function getResponsibleUsers(entityType: EntityType, entityId: string): User[] {
  return store.users.filter(u => getEffectiveRole(u.id, entityType, entityId) === 'responsible');
}

export function getActiveDraft(entityType: EntityType, entityId: string): Draft | undefined {
  return store.drafts.find(d => d.entityType === entityType && d.entityId === entityId && d.status === 'created');
}
