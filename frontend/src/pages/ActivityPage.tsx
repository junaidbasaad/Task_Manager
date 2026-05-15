import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import * as api from "../api/services";
import type { ActivityLog } from "../types";

export function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.fetchActivity(80);
        setLogs(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-fg)]">Activity</h1>
        <p className="text-sm text-[var(--color-muted)]">Recent actions across your workspace</p>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[var(--color-surface-2)] text-xs uppercase text-[var(--color-muted)]">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Context</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-[var(--color-border)]">
                <td className="px-4 py-3 text-[var(--color-muted)]">
                  {format(parseISO(log.createdAt), "MMM d, yyyy HH:mm")}
                </td>
                <td className="px-4 py-3 font-medium text-[var(--color-fg)]">{log.user.name}</td>
                <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                  {log.action.replace(/_/g, " ")}
                </td>
                <td className="max-w-xs px-4 py-3 text-[var(--color-muted)]">{log.details || "—"}</td>
                <td className="px-4 py-3 text-xs text-[var(--color-muted)]">
                  {log.project?.title ? <span className="mr-2">Project: {log.project.title}</span> : null}
                  {log.task?.title ? <span>Task: {log.task.title}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 ? <p className="p-8 text-center text-sm text-[var(--color-muted)]">No activity yet.</p> : null}
      </Card>
    </div>
  );
}
