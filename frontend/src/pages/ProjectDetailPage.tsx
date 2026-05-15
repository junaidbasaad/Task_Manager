import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, UserPlus } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { Spinner } from "../components/ui/Spinner";
import { PriorityBadge, StatusBadge } from "../components/ui/Badge";
import * as api from "../api/services";
import type { Project, Task, TaskPriority, TaskStatus, User } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { format, isPast, parseISO } from "date-fns";

const projectSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
  dueDate: z.string().optional(),
});

type ProjectForm = z.infer<typeof projectSchema>;
type TaskForm = z.infer<typeof taskSchema>;

export function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");

  const projectForm = useForm<ProjectForm>({ resolver: zodResolver(projectSchema) });
  const taskForm = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: "MEDIUM", status: "TODO" },
  });

  const load = useCallback(async () => {
    if (!id) return;
    const [p, t] = await Promise.all([
      api.fetchProject(id),
      api.fetchTasks({ projectId: id, pageSize: 100 }),
    ]);
    setProject(p);
    setTasks(t.tasks);
    if (isAdmin) {
      const u = await api.fetchUsers();
      setUsers(u);
    }
  }, [id, isAdmin]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        await load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load project");
        navigate("/projects");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, load, navigate]);

  useEffect(() => {
    if (project) {
      projectForm.reset({ title: project.title, description: project.description || "" });
    }
  }, [project, projectForm]);

  const memberIds = useMemo(() => new Set(project?.members?.map((m) => m.userId)), [project]);

  const saveProject = projectForm.handleSubmit(async (values) => {
    if (!id || !isAdmin) return;
    try {
      const updated = await api.updateProject(id, {
        title: values.title,
        description: values.description || null,
      });
      setProject(updated);
      toast.success("Project updated");
      setEditProjectOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  });

  const deleteProject = async () => {
    if (!id || !isAdmin) return;
    if (!confirm("Delete this project and all tasks?")) return;
    try {
      await api.deleteProject(id);
      toast.success("Project deleted");
      navigate("/projects");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const createTask = taskForm.handleSubmit(async (values) => {
    if (!id || !isAdmin) return;
    try {
      await api.createTask({
        title: values.title,
        description: values.description || null,
        projectId: id,
        assignedTo: values.assignedTo || null,
        priority: values.priority,
        status: values.status,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      });
      toast.success("Task created");
      taskForm.reset({ title: "", description: "", assignedTo: "", priority: "MEDIUM", status: "TODO" });
      setTaskModal(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create task");
    }
  });

  const addMember = async () => {
    if (!id || !selectedUser) return;
    try {
      await api.addProjectMember(id, selectedUser);
      toast.success("Member added");
      setMemberModal(false);
      setSelectedUser("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add member");
    }
  };

  const removeMember = async (userId: string) => {
    if (!id) return;
    try {
      await api.removeProjectMember(id, userId);
      toast.success("Member removed");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove");
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!isAdmin) return;
    if (!confirm("Delete this task?")) return;
    try {
      await api.deleteTask(taskId);
      toast.success("Task deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const updateMemberTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await api.updateTask(taskId, { status });
      toast.success("Status updated");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/projects" className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-fg)]">
            ← Projects
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-fg)]">{project.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted)]">{project.description || "No description"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/kanban?projectId=${project.id}`}>
            <Button variant="secondary" type="button">
              Open Kanban
            </Button>
          </Link>
          {isAdmin ? (
            <>
              <Button variant="secondary" type="button" onClick={() => setEditProjectOpen(true)}>
                Edit project
              </Button>
              <Button variant="danger" type="button" onClick={deleteProject}>
                Delete
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-fg)]">Team</h2>
            {isAdmin ? (
              <Button type="button" variant="ghost" className="gap-1 px-2 py-1 text-xs" onClick={() => setMemberModal(true)}>
                <UserPlus className="h-4 w-4" /> Add
              </Button>
            ) : null}
          </div>
          <ul className="space-y-2">
            {project.members?.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium text-[var(--color-fg)]">{m.user.name}</div>
                  <div className="text-xs text-[var(--color-muted)]">{m.user.email}</div>
                </div>
                {isAdmin && m.userId !== project.createdBy ? (
                  <button
                    type="button"
                    className="text-red-600 hover:underline"
                    onClick={() => removeMember(m.userId)}
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--color-fg)]">Tasks</h2>
            {isAdmin ? (
              <Button type="button" onClick={() => setTaskModal(true)}>
                New task
              </Button>
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted)]">
                  <th className="py-2 pr-2">Title</th>
                  <th className="py-2 pr-2">Assignee</th>
                  <th className="py-2 pr-2">Priority</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2">Due</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const overdue = t.dueDate && t.status !== "DONE" && isPast(parseISO(t.dueDate));
                  return (
                    <tr key={t.id} className="border-b border-[var(--color-border)]/80">
                      <td className="py-3 pr-2 font-medium text-[var(--color-fg)]">{t.title}</td>
                      <td className="py-3 pr-2 text-[var(--color-muted)]">{t.assignee?.name || "—"}</td>
                      <td className="py-3 pr-2">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="py-3 pr-2">
                        {!isAdmin && t.assignedTo === user?.id ? (
                          <Select
                            value={t.status}
                            onChange={(e) => updateMemberTaskStatus(t.id, e.target.value as TaskStatus)}
                            className="max-w-[140px]"
                          >
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="IN_REVIEW">IN REVIEW</option>
                            <option value="DONE">DONE</option>
                          </Select>
                        ) : (
                          <StatusBadge status={t.status} />
                        )}
                      </td>
                      <td className={`py-3 pr-2 ${overdue ? "font-semibold text-red-600" : "text-[var(--color-muted)]"}`}>
                        {t.dueDate ? format(parseISO(t.dueDate), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="py-3 text-right">
                        {isAdmin ? (
                          <button type="button" className="text-red-600 hover:text-red-700" onClick={() => deleteTask(t.id)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {tasks.length === 0 ? <p className="py-6 text-center text-sm text-[var(--color-muted)]">No tasks yet.</p> : null}
          </div>
        </Card>
      </div>

      <Modal
        open={editProjectOpen}
        title="Edit project"
        onClose={() => setEditProjectOpen(false)}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setEditProjectOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="edit-project-form" disabled={projectForm.formState.isSubmitting}>
              Save
            </Button>
          </>
        }
      >
        <form id="edit-project-form" onSubmit={saveProject} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Title</label>
            <Input {...projectForm.register("title")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Description</label>
            <Textarea {...projectForm.register("description")} />
          </div>
        </form>
      </Modal>

      <Modal
        open={taskModal}
        title="New task"
        onClose={() => setTaskModal(false)}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setTaskModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="task-form" disabled={taskForm.formState.isSubmitting}>
              Create
            </Button>
          </>
        }
      >
        <form id="task-form" onSubmit={createTask} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Title</label>
            <Input {...taskForm.register("title")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Description</label>
            <Textarea {...taskForm.register("description")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Assignee</label>
            <Select {...taskForm.register("assignedTo")}>
              <option value="">Unassigned</option>
              {project.members?.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Priority</label>
              <Select {...taskForm.register("priority")}>
                {(["LOW", "MEDIUM", "HIGH", "URGENT"] as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Status</label>
              <Select {...taskForm.register("status")}>
                {(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as TaskStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Due date</label>
            <Input type="date" {...taskForm.register("dueDate")} />
          </div>
        </form>
      </Modal>

      <Modal
        open={memberModal}
        title="Add team member"
        onClose={() => setMemberModal(false)}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setMemberModal(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={addMember} disabled={!selectedUser}>
              Add
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-[var(--color-muted)]">Choose a user to grant access to this project.</p>
        <Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
          <option value="">Select user…</option>
          {users
            .filter((u) => !memberIds.has(u.id))
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
        </Select>
      </Modal>
    </div>
  );
}
