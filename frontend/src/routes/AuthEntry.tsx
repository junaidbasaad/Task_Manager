import { Navigate } from "react-router-dom";
import { Spinner } from "../components/ui/Spinner";
import { useAuth } from "../contexts/AuthContext";
import { AuthLandingPage } from "../pages/AuthLandingPage";
import { homePathForUser } from "../utils/authRedirect";

export function AuthEntry() {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-2)]">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={homePathForUser(user)} replace />;
  }

  return <AuthLandingPage />;
}

