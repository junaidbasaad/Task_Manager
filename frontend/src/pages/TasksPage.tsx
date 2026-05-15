import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { format, isPast, parseISO } from "date-fns";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { PriorityBadge, StatusBadge } from "../components/ui/Badge";
import * as api from "../api/services";
import type { Project, Task, TaskPriority, TaskStatus } from "../types";
import { useAuth } from "../contexts/AuthContext";

export function TasksPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [sortBy, setSortBy] = useState<
    "createdAt" | "updatedAt" | "dueDate" | "title" | "priority" | "status"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.fetchProjects();
        setProjects(list);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed projects");
      }
    })();
  }, []);

  useEffect(() => {
    setPagination((p) => (p.page === 1 ? p : { ...p, page: 1 }));
  }, [debounced, projectId, status, priority, sortBy, sortOrder]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.fetchTasks({
          page: pagination.page,
          pageSize: pagination.pageSize,
          search: debounced || undefined,
          projectId: projectId || undefined,
          status: status || undefined,
          priority: priority || undefined,
          sortBy,
          sortOrder,
        });
        setTasks(res.tasks);
        setPagination(res.pagination);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed tasks");
      } finally {
        setLoading(false);
      }
    })();
  }, [pagination.page, pagination.pageSize, debounced, projectId, status, priority, sortBy, sortOrder]);

  const pageButtons = useMemo(() => {
    const pages: number[] = [];
    for (let i = 1; i <= pagination.totalPages; i++) pages.push(i);
    return pages;
  }, [pagination.totalPages]);

  const updateStatus = async (task: Task, next: TaskStatus) => {
    if (user?.role === "MEMBER" && task.assignedTo !== user.id) return;
    try {
      await api.updateTask(task.id, { status: next });
      toast.success("Updated");
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-fg)]">Tasks</h1>
        <p className="text-sm text-[var(--color-muted)]">Search, filter, and sort across your work</p>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <Input placeholder="Search title or description…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus | "")}>
            <option value="">All statuses</option>
            {(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as TaskStatus[]).map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority | "")}>
            <option value="">All priorities</option>
            {(["LOW", "MEDIUM", "HIGH", "URGENT"] as TaskPriority[]).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="createdAt">Sort: created</option>
            <option value="updatedAt">Sort: updated</option>
            <option value="dueDate">Sort: due date</option>
            <option value="title">Sort: title</option>
            <option value="priority">Sort: priority</option>
            <option value="status">Sort: status</option>
          </Select>
          <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </Select>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-10 w-10" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted)]">
                  <th className="py-2 pr-2">Task</th>
                  <th className="py-2 pr-2">Project</th>
                  <th className="py-2 pr-2">Assignee</th>
                  <th className="py-2 pr-2">Priority</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2">Due</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const overdue = t.dueDate && t.status !== "DONE" && isPast(parseISO(t.dueDate));
                  const canEditStatus = user?.role === "ADMIN" || t.assignedTo === user?.id;
                  return (
                    <tr key={t.id} className="border-b border-[var(--color-border)]/80">
                      <td className="py-3 pr-2">
                        <Link to={`/projects/${t.projectId}`} className="font-medium text-[var(--color-fg)] hover:underline">
                          {t.title}
                        </Link>
                        <div className="text-xs text-[var(--color-muted)] line-clamp-1">{t.description}</div>
                      </td>
                      <td className="py-3 pr-2 text-[var(--color-muted)]">{t.project?.title}</td>
                      <td className="py-3 pr-2 text-[var(--color-muted)]">{t.assignee?.name || "—"}</td>
                      <td className="py-3 pr-2">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="py-3 pr-2">
                        {canEditStatus ? (
                          <Select
                            value={t.status}
                            onChange={(e) => updateStatus(t, e.target.value as TaskStatus)}
                            className="max-w-[150px]"
                          >
                            {(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as TaskStatus[]).map((s) => (
                              <option key={s} value={s}>
                                {s.replace("_", " ")}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <StatusBadge status={t.status} />
                        )}
                      </td>
                      <td className={`py-3 pr-2 ${overdue ? "font-semibold text-red-600" : "text-[var(--color-muted)]"}`}>
                        {t.dueDate ? format(parseISO(t.dueDate), "MMM d, yyyy") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {tasks.length === 0 ? <p className="py-8 text-center text-sm text-[var(--color-muted)]">No tasks found.</p> : null}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-4 text-sm">
          <span className="text-[var(--color-muted)]">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex flex-wrap gap-1">
            {pageButtons.slice(0, 8).map((p) => (
              <Button
                key={p}
                variant={p === pagination.page ? "primary" : "secondary"}
                className="min-w-9 px-2 py-1 text-xs"
                type="button"
                onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
