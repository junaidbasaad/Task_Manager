import { clsx } from "clsx";
import type { TaskPriority, TaskStatus } from "../../types";

const statusColors: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  IN_REVIEW: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  DONE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

const priorityColors: Record<TaskPriority, string> = {
  LOW: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  MEDIUM: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-100",
  HIGH: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-100",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const label = status.replace("_", " ");
  return (
    <span className={clsx("rounded-md px-2 py-0.5 text-xs font-medium", statusColors[status])}>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={clsx("rounded-md px-2 py-0.5 text-xs font-medium", priorityColors[priority])}>
      {priority}
    </span>
  );
}
