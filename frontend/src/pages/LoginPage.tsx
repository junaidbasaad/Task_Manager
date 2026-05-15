import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

type Form = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
      toast.success("Welcome back");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Login failed");
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-2)] p-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)] text-lg font-bold text-[var(--color-accent-foreground)]">
            TM
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-fg)]">Sign in</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Team Task Manager</p>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="space-y-4 text-left">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Email</label>
              <Input type="email" autoComplete="email" {...register("email")} />
              {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Password</label>
              <Input type="password" autoComplete="current-password" {...register("password")} />
              {errors.password ? (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
            No account?{" "}
            <Link to="/register" className="font-medium text-[var(--color-accent)] hover:underline">
              Create one
            </Link>
          </p>
        </Card>
        <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
          Demo: admin@example.com / Password123!
        </p>
      </motion.div>
    </div>
  );
}
