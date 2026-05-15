import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "../components/ui/Spinner";
import { useAuth } from "../contexts/AuthContext";
import { homePathForUser } from "../utils/authRedirect";

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-2)]">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function AdminRoute({ children }: { children: ReactElement }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-2)]">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function GuestRoute({ children }: { children: ReactElement }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || homePathForUser(user);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-2)]">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={from} replace />;
  }

  return children;
}
