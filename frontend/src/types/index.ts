export type UserRole = "ADMIN" | "MEMBER";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImage?: string | null;
  createdAt?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  createdBy: string;
  createdAt: string;
  members?: ProjectMember[];
  _count?: { tasks: number; members: number };
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  user: User;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  assignedTo?: string | null;
  projectId: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignee?: User | null;
  creator?: User;
  project?: { id: string; title: string };
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  statusDistribution: { status: TaskStatus; count: number }[];
  priorityDistribution: { priority: TaskPriority; count: number }[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  projectId?: string | null;
  taskId?: string | null;
  action: string;
  details?: string | null;
  createdAt: string;
  user: Pick<User, "id" | "name" | "email" | "profileImage">;
  project?: { id: string; title: string } | null;
  task?: { id: string; title: string } | null;
}

export interface Paginated<T> {
  items: T;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}
