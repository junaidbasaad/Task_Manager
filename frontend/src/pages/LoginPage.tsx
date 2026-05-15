import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { assertRoleMatches, homePathForUser } from "../utils/authRedirect";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { RoleSelect } from "../components/auth/RoleSelect";
import type { UserRole } from "../types";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["ADMIN", "MEMBER"]),
});

type Form = z.infer<typeof schema>;

const DEMO_ADMIN = { email: "admin@example.com", password: "Password123!", role: "ADMIN" as const };

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { role: "MEMBER" },
  });

  const signIn = async (email: string, password: string, role: UserRole) => {
    const signedIn = await login(email, password);
    assertRoleMatches(signedIn, role);
    toast.success("Welcome back");
    navigate(from || homePathForUser(signedIn), { replace: true });
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signIn(values.email, values.password, values.role);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Login failed");
    }
  });

  const onDemoAdmin = async () => {
    setValue("email", DEMO_ADMIN.email);
    setValue("password", DEMO_ADMIN.password);
    setValue("role", DEMO_ADMIN.role);
    try {
      await signIn(DEMO_ADMIN.email, DEMO_ADMIN.password, DEMO_ADMIN.role);
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Demo login failed — run npm run db:seed on the API service",
      );
    }
  };

  return (
    <motion.div
      className="flex min-h-screen items-center justify-center bg-[var(--color-surface-2)] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)] text-lg font-bold text-[var(--color-accent-foreground)]">
            TM
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-fg)]">Sign in</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Select your account type, then enter your credentials
          </p>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="space-y-4 text-left">
            <Controller
              name="role"
              control={control}
              render={({ field }) => <RoleSelect value={field.value} onChange={field.onChange} id="login-role" />}
            />
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
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={isSubmitting}
              onClick={() => void onDemoAdmin()}
            >
              Sign in as demo admin
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
            No account?{" "}
            <Link to="/" className="font-medium text-[var(--color-accent)] hover:underline">
              Choose sign up option
            </Link>
          </p>
        </Card>
      </motion.div>
    </motion.div>
  );
}

