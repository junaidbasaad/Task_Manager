import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Shield, Users, Folder, ListChecks, Activity } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { Select } from "../components/ui/Select";
import { useAuth } from "../contexts/AuthContext";
import * as api from "../api/services";
import type { DashboardStats, User } from "../types";
import { mediaUrl } from "../utils/mediaUrl";

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [s, u] = await Promise.all([api.fetchDashboardStats(), api.fetchUsers()]);
    setStats(s);
    setUsers(u);
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load admin data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onRoleChange = async (userId: string, role: "ADMIN" | "MEMBER") => {
    try {
      const updated = await api.updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      toast.success("Role updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update role");
    }
  };

  if (loading || !stats) {
    return (
      <motion.div className="flex items-center justify-center py-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Spinner className="h-10 w-10" />
      </motion.div>
    );
  }

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const statusData = stats.statusDistribution.map((r) => ({
    name: r.status.replace("_", " "),
    count: r.count,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <Shield className="h-3.5 w-3.5" />
            Admin control center
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-fg)]">Admin dashboard</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Signed in as {user?.name} — manage users and monitor the whole workspace.
          </p>
        </motion.div>
        <Link
          to="/dashboard"
          className="text-sm font-medium text-[var(--color-accent)] hover:underline"
        >
          ← Member dashboard
        </Link>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Users", value: users.length, icon: Users },
          { label: "Admins", value: adminCount, icon: Shield },
          { label: "Projects", value: stats.totalProjects, icon: Folder },
          { label: "Tasks", value: stats.totalTasks, icon: ListChecks },
        ].map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                  {c.label}
                </span>
                <c.icon className="h-5 w-5 text-[var(--color-accent)]" />
              </div>
              <div className="mt-2 text-3xl font-semibold tabular-nums">{c.value}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-fg)]">Workspace task flow</h2>
          <div className="h-64">
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-fg)]">Health snapshot</h2>
            <Link to="/activity" className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)]">
              <Activity className="h-3.5 w-3.5" /> Activity log
            </Link>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <motion.div whileHover={{ scale: 1.02 }}>
              <dt className="text-[var(--color-muted)]">Completed</dt>
              <dd className="text-2xl font-semibold text-emerald-600">{stats.completedTasks}</dd>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }}>
              <dt className="text-[var(--color-muted)]">Pending</dt>
              <dd className="text-2xl font-semibold">{stats.pendingTasks}</dd>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }}>
              <dt className="text-[var(--color-muted)]">Overdue</dt>
              <dd className="text-2xl font-semibold text-red-600">{stats.overdueTasks}</dd>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }}>
              <dt className="text-[var(--color-muted)]">Members</dt>
              <dd className="text-2xl font-semibold">{users.length - adminCount}</dd>
            </motion.div>
          </dl>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-[var(--color-fg)]">User management</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-muted)]">
                <th className="pb-3 pr-4 font-medium">User</th>
                <th className="pb-3 pr-4 font-medium">Email</th>
                <th className="pb-3 pr-4 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--color-border)]/60 last:border-0">
                  <td className="py-3 pr-4">
                    <motion.div
                      className="flex items-center gap-3"
                      initial={false}
                      whileHover={{ x: 2 }}
                    >
                      <img
                        src={
                          mediaUrl(u.profileImage) ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`
                        }
                        alt=""
                        className="h-8 w-8 rounded-full border border-[var(--color-border)]"
                      />
                      <span className="font-medium text-[var(--color-fg)]">{u.name}</span>
                    </motion.div>
                  </td>
                  <td className="py-3 pr-4 text-[var(--color-muted)]">{u.email}</td>
                  <td className="py-3 pr-4">
                    {u.id === user?.id ? (
                      <span className="rounded-full bg-[var(--color-accent)]/15 px-2 py-1 text-xs font-medium">
                        {u.role} (you)
                      </span>
                    ) : (
                      <Select
                        value={u.role}
                        onChange={(e) => void onRoleChange(u.id, e.target.value as "ADMIN" | "MEMBER")}
                        className="max-w-[140px]"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="MEMBER">MEMBER</option>
                      </Select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
