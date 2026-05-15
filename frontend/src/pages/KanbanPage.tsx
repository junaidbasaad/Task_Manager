import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import toast from "react-hot-toast";
import { Card } from "../components/ui/Card";
import { Select } from "../components/ui/Select";
import { Spinner } from "../components/ui/Spinner";
import { PriorityBadge } from "../components/ui/Badge";
import * as api from "../api/services";
import type { Project, Task, TaskStatus } from "../types";

const columns: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export function KanbanPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    const list = await api.fetchProjects();
    setProjects(list);
  }, []);

  const loadTasks = useCallback(async () => {
    const res = await api.fetchTasks({
      projectId: projectId || undefined,
      pageSize: 200,
      sortBy: "updatedAt",
      sortOrder: "desc",
    });
    setTasks(res.tasks);
  }, [projectId]);

  useEffect(() => {
    (async () => {
      try {
        await loadProjects();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load projects");
      }
    })();
  }, [loadProjects]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await loadTasks();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadTasks]);

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: [],
    };
    for (const t of tasks) {
      map[t.status].push(t);
    }
    return map;
  }, [tasks]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const nextStatus = destination.droppableId as TaskStatus;
    const taskId = draggableId;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.status === nextStatus) return;

    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t)));
    try {
      await api.updateTask(taskId, { status: nextStatus });
      toast.success("Task moved");
    } catch (e) {
      setTasks(previous);
      toast.error(e instanceof Error ? e.message : "Could not move task");
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-fg)]">Kanban</h1>
          <p className="text-sm text-[var(--color-muted)]">Drag cards between columns to update status</p>
        </div>
        <div className="w-full max-w-xs">
          <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Project filter</label>
          <Select
            value={projectId}
            onChange={(e) => {
              const v = e.target.value;
              setSearchParams(v ? { projectId: v } : {});
            }}
          >
            <option value="">All accessible projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner className="h-10 w-10" />
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {columns.map((col) => (
              <Droppable droppableId={col} key={col}>
                {(provided, snapshot) => (
                  <Card
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex min-h-[420px] flex-col bg-[var(--color-surface-2)] p-3 ${
                      snapshot.isDraggingOver ? "ring-2 ring-[var(--color-accent)]/40" : ""
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between px-1">
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                        {col.replace("_", " ")}
                      </h2>
                      <span className="text-xs text-[var(--color-muted)]">{grouped[col].length}</span>
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      {grouped[col].map((task, index) => (
                        <Draggable draggableId={task.id} index={index} key={task.id}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={`rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm ${
                                dragSnapshot.isDragging ? "shadow-lg ring-2 ring-[var(--color-accent)]/30" : ""
                              }`}
                            >
                              <div className="text-sm font-medium text-[var(--color-fg)]">{task.title}</div>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <PriorityBadge priority={task.priority} />
                                <span className="text-xs text-[var(--color-muted)]">{task.project?.title}</span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </Card>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
