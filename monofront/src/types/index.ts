export type UserRole = 'read' | 'edit' | 'responsible';
export type EntityType = 'namespace' | 'project' | 'service';
export type DraftStatus = 'created' | 'approved' | 'cancelled';

export interface User {
  id: string;
  login: string;
  password: string;
  firstName: string;
  lastName: string;
  position: string;
  email: string;
  department: string;
}

export interface Namespace {
  id: string;
  name: string;
  displayName: string;
  description: string;
}

export interface Project {
  id: string;
  namespaceId: string;
  parentProjectId?: string;
  name: string;
  displayName: string;
  description: string;
}

export interface Service {
  id: string;
  projectId: string;
  name: string;
  displayName: string;
  description: string;
  config: Record<string, unknown>;
}

export interface RoleAssignment {
  userId: string;
  entityType: EntityType;
  entityId: string;
  role: UserRole;
}

export interface Draft {
  id: string;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  configBefore: Record<string, unknown>;
  configAfter: Record<string, unknown>;
  authorId: string;
  createdAt: string;
  status: DraftStatus;
  approverIds: string[];
}

export interface CatalogNode {
  type: EntityType;
  id: string;
  name: string;
  displayName: string;
  description: string;
  effectiveRole: UserRole | null;
  activeDraftId?: string;
  children?: CatalogNode[];
  config?: Record<string, unknown>;
}

export interface EntityDetail {
  type: EntityType;
  id: string;
  name: string;
  displayName: string;
  description: string;
  effectiveRole: UserRole | null;
  responsibleUsers: User[];
  activeDraft?: Draft;
  config?: Record<string, unknown>;
}
