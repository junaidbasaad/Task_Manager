import { api } from "./client";
import type { ActivityLog, DashboardStats, Project, Task, User } from "../types";

export async function register(payload: { name: string; email: string; password: string }) {
  const { data } = await api.post("/api/auth/register", payload);
  return data.data as { user: User; token: string };
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post("/api/auth/login", payload);
  return data.data as { user: User; token: string };
}

export async function fetchMe() {
  const { data } = await api.get("/api/auth/me");
  return data.data.user as User;
}

export async function updateProfile(payload: {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  const { data } = await api.patch("/api/auth/profile", payload);
  return data.data.user as User;
}

export async function uploadProfileImage(file: File) {
  const form = new FormData();
  form.append("image", file);
  const { data } = await api.post("/api/auth/profile/image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data.user as User;
}

export async function fetchProjects() {
  const { data } = await api.get("/api/projects");
  return data.data.projects as Project[];
}

export async function fetchProject(id: string) {
  const { data } = await api.get(`/api/projects/${id}`);
  return data.data.project as Project;
}

export async function createProject(payload: { title: string; description?: string | null }) {
  const { data } = await api.post("/api/projects", payload);
  return data.data.project as Project;
}

export async function updateProject(
  id: string,
  payload: { title?: string; description?: string | null },
) {
  const { data } = await api.patch(`/api/projects/${id}`, payload);
  return data.data.project as Project;
}

export async function deleteProject(id: string) {
  await api.delete(`/api/projects/${id}`);
}

export async function addProjectMember(projectId: string, userId: string) {
  const { data } = await api.post(`/api/projects/${projectId}/members`, { userId });
  return data.data.members as Project["members"];
}

export async function removeProjectMember(projectId: string, userId: string) {
  await api.delete(`/api/projects/${projectId}/members/${userId}`);
}

export async function fetchTasks(params: Record<string, string | number | undefined>) {
  const { data } = await api.get("/api/tasks", { params });
  return data.data as {
    tasks: Task[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  };
}

export async function fetchTask(id: string) {
  const { data } = await api.get(`/api/tasks/${id}`);
  return data.data.task as Task;
}

export async function createTask(payload: {
  title: string;
  description?: string | null;
  projectId: string;
  assignedTo?: string | null;
  priority?: string;
  status?: string;
  dueDate?: string | null;
}) {
  const { data } = await api.post("/api/tasks", payload);
  return data.data.task as Task;
}

export async function updateTask(
  id: string,
  payload: Partial<{
    title: string;
    description: string | null;
    assignedTo: string | null;
    priority: string;
    status: string;
    dueDate: string | null;
  }>,
) {
  const { data } = await api.patch(`/api/tasks/${id}`, payload);
  return data.data.task as Task;
}

export async function deleteTask(id: string) {
  await api.delete(`/api/tasks/${id}`);
}

export async function fetchDashboardStats() {
  const { data } = await api.get("/api/dashboard/stats");
  return data.data as DashboardStats;
}

export async function fetchActivity(limit?: number) {
  const { data } = await api.get("/api/dashboard/activity", { params: { limit } });
  return data.data.logs as ActivityLog[];
}

export async function fetchUsers() {
  const { data } = await api.get("/api/users");
  return data.data.users as User[];
}

export async function updateUserRole(userId: string, role: "ADMIN" | "MEMBER") {
  const { data } = await api.patch(`/api/users/${userId}/role`, { role });
  return data.data.user as User;
}
