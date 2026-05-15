import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Waves, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "../components/ui/Card";
import { Select } from "../components/ui/Select";
import { Spinner } from "../components/ui/Spinner";
import { PriorityBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import * as api from "../api/services";
import type { Project, Task, TaskStatus } from "../types";

const STAGES: { id: TaskStatus; label: string; hue: string }[] = [
  { id: "TODO", label: "Source", hue: "from-slate-400/30 to-slate-500/10" },
  { id: "IN_PROGRESS", label: "Current", hue: "from-teal-500/35 to-teal-600/10" },
  { id: "IN_REVIEW", label: "Rapids", hue: "from-amber-500/35 to-amber-600/10" },
  { id: "DONE", label: "Delta", hue: "from-emerald-500/35 to-emerald-600/10" },
];

const NEXT: Partial<Record<TaskStatus, TaskStatus>> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "IN_REVIEW",
  IN_REVIEW: "DONE",
};

export function TaskFlowRiverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setProjects(await api.fetchProjects());
  }, []);

  const loadTasks = useCallback(async () => {
    const res = await api.fetchTasks({
      projectId: projectId || undefined,
      pageSize: 200,
      sortBy: "priority",
      sortOrder: "desc",
    });
    setTasks(res.tasks);
  }, [projectId]);

  useEffect(() => {
    loadProjects().catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load projects"));
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
    const map = Object.fromEntries(STAGES.map((s) => [s.id, [] as Task[]])) as Record<TaskStatus, Task[]>;
    for (const t of tasks) map[t.status].push(t);
    return map;
  }, [tasks]);

  const advanceTask = async (task: Task) => {
    const next = NEXT[task.status];
    if (!next) return;
    const prev = tasks;
    setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    try {
      await api.updateTask(task.id, { status: next });
      toast.success(`Moved to ${next.replace("_", " ").toLowerCase()}`);
    } catch (e) {
      setTasks(prev);
      toast.error(e instanceof Error ? e.message : "Could not advance task");
    }
  };

  return (
    <motion.div
      className="mx-auto max-w-6xl space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.header
        className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-surface-2)] to-[var(--color-surface)] p-6"
        initial={{ y: 12 }}
        animate={{ y: 0 }}
      >
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "repeating-linear-gradient(105deg, transparent, transparent 40px, var(--color-accent) 40px, var(--color-accent) 41px)",
          }}
          animate={{ x: [0, 80] }}
          transition={{ repeat: Infinity, duration: 14, ease: "linear" }}
        />
        <motion.div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--color-accent)]/15 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ repeat: Infinity, duration: 5 }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ repeat: Infinity, duration: 6 }}
        />
        <motion.div
          className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
              <Waves className="h-3.5 w-3.5" />
              Task Flow River
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-fg)]">
              Work flows downstream
            </h1>
            <p className="mt-1 max-w-lg text-sm text-[var(--color-muted)]">
              Tasks ride four currents from idea to done. Tap a card, then advance it to the next
              stage — no drag-and-drop boards.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Project</label>
            <Select
              value={projectId}
              onChange={(e) => {
                const v = e.target.value;
                setSearchParams(v ? { projectId: v } : {});
              }}
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </div>
        </motion.div>
      </motion.header>

      {loading ? (
        <motion.div className="flex justify-center py-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Spinner className="h-10 w-10" />
        </motion.div>
      ) : (
        <div className="relative grid gap-4 lg:grid-cols-4">
          <div
            className="pointer-events-none absolute left-0 right-0 top-1/2 hidden h-1 -translate-y-1/2 bg-gradient-to-r from-transparent via-[var(--color-accent)]/40 to-transparent lg:block"
            aria-hidden
          />
          {STAGES.map((stage, stageIndex) => (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stageIndex * 0.08 }}
            >
              <Card
                className={`relative min-h-[320px] overflow-hidden border-[var(--color-border)] bg-gradient-to-b ${stage.hue}`}
              >
                <motion.div
                  className="absolute inset-x-0 top-0 h-1 bg-[var(--color-accent)]/50"
                  animate={{ scaleX: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2.5 + stageIndex * 0.3 }}
                  style={{ transformOrigin: "left" }}
                />
                <motion.div
                  className="mb-3 flex items-center justify-between"
                  initial={false}
                  animate={{ x: stageIndex % 2 === 0 ? [0, 4, 0] : [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 4 + stageIndex }}
                >
                  <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-fg)]">
                    {stage.label}
                  </h2>
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium tabular-nums dark:bg-white/10">
                    {grouped[stage.id].length}
                  </span>
                </motion.div>

                <ul className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {grouped[stage.id].map((task, i) => {
                      const isActive = activeId === task.id;
                      const canAdvance = Boolean(NEXT[task.status]);
                      return (
                        <motion.li
                          key={task.id}
                          layout
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.02 }}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveId(isActive ? null : task.id)}
                            className={`w-full rounded-xl border p-3 text-left transition ${
                              isActive
                                ? "border-[var(--color-accent)] bg-[var(--color-surface)] shadow-md ring-2 ring-[var(--color-accent)]/25"
                                : "border-[var(--color-border)] bg-[var(--color-surface)]/90 hover:border-[var(--color-accent)]/40"
                            } ${task.priority === "URGENT" ? "animate-pulse" : ""}`}
                          >
                            <motion.div
                              className="flex items-start gap-2"
                              whileHover={{ x: 2 }}
                            >
                              {task.priority === "URGENT" ? (
                                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                              ) : null}
                              <motion.div
                                className="min-w-0 flex-1"
                                layout
                              >
                                <div className="text-sm font-medium text-[var(--color-fg)]">{task.title}</div>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <PriorityBadge priority={task.priority} />
                                  {task.project?.title ? (
                                    <span className="truncate text-xs text-[var(--color-muted)]">
                                      {task.project.title}
                                    </span>
                                  ) : null}
                                </div>
                              </motion.div>
                            </motion.div>
                            {isActive && canAdvance ? (
                              <motion.div
                                className="mt-3 border-t border-[var(--color-border)] pt-3"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                              >
                                <Button
                                  type="button"
                                  className="w-full gap-1 py-1.5 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void advanceTask(task);
                                    setActiveId(null);
                                  }}
                                >
                                  Advance downstream
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            ) : null}
                            {isActive && !canAdvance ? (
                              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                                Reached the delta — complete.
                              </p>
                            ) : null}
                          </button>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
                {grouped[stage.id].length === 0 ? (
                  <p className="py-8 text-center text-xs text-[var(--color-muted)]">Calm waters</p>
                ) : null}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
