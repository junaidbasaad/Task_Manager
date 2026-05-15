import type { ReactNode } from "react";
import { Suspense } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Activity,
  CheckSquare,
  Waves,
  FolderKanban,
  Shield,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  UserCircle,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { mediaUrl } from "../../utils/mediaUrl";
import { Spinner } from "../ui/Spinner";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
    isActive
      ? "bg-[var(--color-accent)]/15 text-[var(--color-fg)]"
      : "text-[var(--color-muted)] hover:bg-black/5 hover:text-[var(--color-fg)] dark:hover:bg-white/5",
  );

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const avatar = mediaUrl(user?.profileImage);

  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)] text-sm font-bold text-[var(--color-accent-foreground)]">
            TM
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--color-fg)]">Team Task Manager</div>
            <p className="text-xs text-[var(--color-muted)]">
              {user?.role === "ADMIN" ? "Admin workspace" : "Member workspace"}
            </p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          <NavLink to="/" end className={linkClass}>
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </NavLink>
          <NavLink to="/projects" className={linkClass}>
            <FolderKanban className="h-4 w-4" /> Projects
          </NavLink>
          <NavLink to="/tasks" className={linkClass}>
            <CheckSquare className="h-4 w-4" /> Tasks
          </NavLink>
          <NavLink to="/flow" className={linkClass}>
            <Waves className="h-4 w-4" /> Flow River
          </NavLink>
          {user?.role === "ADMIN" ? (
            <NavLink to="/admin" className={linkClass}>
              <Shield className="h-4 w-4" /> Admin
            </NavLink>
          ) : null}
          <NavLink to="/activity" className={linkClass}>
            <Activity className="h-4 w-4" /> Activity
          </NavLink>
        </nav>
        <div className="mt-auto space-y-2 border-t border-[var(--color-border)] pt-4">
          <NavLink to="/profile" className={linkClass}>
            <img
              src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || "U")}`}
              alt=""
              className="h-6 w-6 rounded-full border border-[var(--color-border)]"
            />
            Profile
          </NavLink>
          <button
            type="button"
            onClick={toggle}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-muted)] hover:bg-black/5 hover:text-[var(--color-fg)] dark:hover:bg-white/5"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)] text-xs font-bold text-[var(--color-accent-foreground)]">
              TM
            </div>
            <span className="text-sm font-semibold">Team Tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-black/5 dark:hover:bg-white/5"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg p-2 text-red-600 hover:bg-red-500/10"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Suspense
            fallback={
              <div className="flex min-h-[40vh] items-center justify-center">
                <Spinner className="h-10 w-10" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
        <nav className="grid grid-cols-5 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-1 py-2 md:hidden">
          <MobileNav to="/" icon={<LayoutDashboard className="h-5 w-5" />} label="Home" />
          <MobileNav to="/flow" icon={<Waves className="h-5 w-5" />} label="Flow" />
          <MobileNav to="/tasks" icon={<CheckSquare className="h-5 w-5" />} label="Tasks" />
          {user?.role === "ADMIN" ? (
            <MobileNav to="/admin" icon={<Shield className="h-5 w-5" />} label="Admin" />
          ) : (
            <MobileNav to="/projects" icon={<FolderKanban className="h-5 w-5" />} label="Projects" />
          )}
          <MobileNav to="/profile" icon={<UserCircle className="h-5 w-5" />} label="Profile" />
        </nav>
      </div>
    </div>
  );
}

function MobileNav({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "flex flex-col items-center gap-1 rounded-lg py-1 text-[10px] font-medium",
          isActive ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]",
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
