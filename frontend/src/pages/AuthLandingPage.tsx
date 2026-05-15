import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Users, Waves } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export function AuthLandingPage() {
  return (
    <motion.div
      className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-surface-2)] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-lg space-y-8 text-center">
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-xl font-bold text-[var(--color-accent-foreground)]">
            TM
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-fg)]">Team Task Manager</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Choose how you join — administrators run the workspace, members collaborate on tasks.
          </p>
        </motion.div>

        <Card className="space-y-4 text-left">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Create an account
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/register?role=ADMIN" className="block">
              <Button type="button" variant="secondary" className="h-auto w-full flex-col gap-2 py-4">
                <Shield className="h-6 w-6 text-amber-600" />
                <span className="font-semibold">Sign up as Admin</span>
                <span className="text-xs font-normal text-[var(--color-muted)]">
                  Manage users, projects & tasks
                </span>
              </Button>
            </Link>
            <Link to="/register?role=MEMBER" className="block">
              <Button type="button" variant="secondary" className="h-auto w-full flex-col gap-2 py-4">
                <Users className="h-6 w-6 text-[var(--color-accent)]" />
                <span className="font-semibold">Sign up as Member</span>
                <span className="text-xs font-normal text-[var(--color-muted)]">
                  Work on assigned tasks & projects
                </span>
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="text-left">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Already have an account?
          </p>
          <Link to="/login">
            <Button type="button" className="w-full gap-2">
              <Waves className="h-4 w-4" />
              Sign in
            </Button>
          </Link>
          <p className="mt-3 text-center text-xs text-[var(--color-muted)]">
            On sign in, pick <strong className="text-[var(--color-fg)]">Admin</strong> or{" "}
            <strong className="text-[var(--color-fg)]">Member</strong> to match your account.
          </p>
        </Card>
      </div>
    </motion.div>
  );
}

