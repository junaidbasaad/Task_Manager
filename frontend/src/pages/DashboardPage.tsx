import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle2, Folder, ListChecks, Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import * as api from "../api/services";
import type { DashboardStats } from "../types";

const COLORS = ["#0d9488", "#14b8a6", "#ea580c", "#64748b"];

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const s = await api.fetchDashboardStats();
        setStats(s);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  const statusData = stats.statusDistribution.map((r) => ({
    name: r.status.replace("_", " "),
    count: r.count,
  }));

  const priorityData = stats.priorityDistribution.map((r) => ({
    name: r.priority,
    value: r.count,
  }));

  const statCards = [
    {
      label: "Projects",
      value: stats.totalProjects,
      icon: <Folder className="h-5 w-5 text-[var(--color-accent)]" />,
    },
    {
      label: "Tasks",
      value: stats.totalTasks,
      icon: <ListChecks className="h-5 w-5 text-[var(--color-accent)]" />,
    },
    {
      label: "Completed",
      value: stats.completedTasks,
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    },
    {
      label: "Pending",
      value: stats.pendingTasks,
      icon: <Activity className="h-5 w-5 text-amber-500" />,
    },
    {
      label: "Overdue",
      value: stats.overdueTasks,
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      warn: stats.overdueTasks > 0,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-fg)]">
            Welcome, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            {user?.role === "ADMIN"
              ? "Workspace overview — open Admin for user management."
              : "Your tasks and projects at a glance"}
          </p>
        </div>
        <motion.div className="flex flex-wrap gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {user?.role === "ADMIN" ? (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-500/25 dark:text-amber-200"
            >
              <Shield className="h-4 w-4" /> Admin dashboard
            </Link>
          ) : null}
          <Link
            to="/activity"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-fg)] shadow-sm hover:bg-[var(--color-surface-2)]"
          >
            View activity log
          </Link>
        </motion.div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className={c.warn ? "border-red-300/60 dark:border-red-900/50" : ""}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                  {c.label}
                </span>
                {c.icon}
              </div>
              <div className="mt-3 text-3xl font-semibold tabular-nums text-[var(--color-fg)]">{c.value}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-fg)]">Task status</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--color-muted)", fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--color-muted)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="count" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-fg)]">Priority distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {priorityData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
