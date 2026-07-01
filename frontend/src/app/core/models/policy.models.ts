export type UserRole = 'viewer' | 'reviewer' | 'editor' | 'approver' | 'linguistic_reviewer' | 'external_collaborator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  color?: string; // for Yjs awareness cursor color
}

export type PolicyStatus = 'draft' | 'in_review' | 'linguistic_review' | 'pending_approval' | 'published' | 'archived';

export interface Policy {
  id: string;
  tenantId: string;
  title: string;
  scope?: string;
  jurisdiction?: string;
  status: PolicyStatus;
  parentId?: string;
  currentVersionId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  permissions?: PolicyPermission[];
}

export interface PolicyVersion {
  id: string;
  policyId: string;
  versionNo: number;
  docxPath?: string;
  changeSummary?: string;
  createdBy: string;
  createdAt: string;
  creator?: { id: string; name: string };
  contributorsJson?: Array<{ id: string; name: string; role: string }>;
}

export interface PolicyPermission {
  id: string;
  policyId: string;
  userId: string;
  role: UserRole;
  user?: User;
}

export interface Comment {
  id: string;
  versionId: string;
  anchorJson?: unknown;
  authorId: string;
  author?: User;
  body: string;
  parentCommentId?: string;
  resolved: boolean;
  createdAt: string;
  replies?: Comment[];
}

export interface Revision {
  id: string;
  versionId: string;
  type: 'insert' | 'delete' | 'format';
  authorId: string;
  author?: User;
  rangeJson?: unknown;
  payload?: unknown;
  accepted?: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  policyId: string;
  authorId: string;
  author?: User;
  body: string;
  mentionsJson?: string[];
  createdAt: string;
}

export interface PdfExportOptions {
  includeTrackedChanges: boolean;
  includeComments: boolean;
  versionId: string;
}

export interface AuditLogEntry {
  id: string;
  policyId: string;
  userId: string;
  user?: User;
  action: string;
  metadataJson?: unknown;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
