// ─── Domain types shared across the application ──────────────

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // bcrypt hash, never exposed
  role: UserRole;
  created_at: string;
}

export type UserRole = 'admin' | 'clerk' | 'magistrate' | 'registrar' | 'viewer';

export type CaseType = 'Criminal' | 'Civil' | 'Family' | 'Commercial' | 'Labour';
export type CaseStatus = 'Open' | 'Active' | 'Pending' | 'Closed';
export type CasePriority = 'Low' | 'Medium' | 'High';
export type SortOrder = 'asc' | 'desc';

export interface Case {
  id: string;
  case_number: string;
  title: string;
  case_type: CaseType;
  status: CaseStatus;
  priority: CasePriority;
  plaintiff: string;
  defendant: string;
  presiding_officer: string;
  hearing_date: string | null;
  next_action: string;
  description: string;
  created_by: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseLog {
  id: string;
  case_id: string;
  user_id: string;
  action: string;
  note: string;
  performed_at: string;
  user_name?: string; // joined from users table
}

// ─── API contracts ───────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: Array<{ field: string; message: string }>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

export interface DashboardStats {
  total: number;
  open: number;
  active: number;
  closed: number;
  pending: number;
  high: number;
  byType: Array<{ type: string; count: number }>;
  recent: Case[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── JWT payload ─────────────────────────────────────────────

export interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
