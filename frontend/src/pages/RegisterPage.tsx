import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { homePathForUser } from "../utils/authRedirect";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { RoleSelect } from "../components/auth/RoleSelect";
import type { UserRole } from "../types";

const schema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email(),
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
    role: z.enum(["ADMIN", "MEMBER"]),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords must match", path: ["confirm"] });

type Form = z.infer<typeof schema>;

function roleFromQuery(param: string | null): UserRole {
  return param === "ADMIN" ? "ADMIN" : "MEMBER";
}

export function RegisterPage() {
  const { register: regUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = roleFromQuery(searchParams.get("role"));

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { role: initialRole },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const user = await regUser(values.name, values.email, values.password, values.role);
      toast.success(`Account created as ${values.role === "ADMIN" ? "Admin" : "Member"}`);
      navigate(homePathForUser(user), { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-2)] p-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)] text-lg font-bold text-[var(--color-accent-foreground)]">
            TM
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-fg)]">Create account</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {initialRole === "ADMIN"
              ? "Registering as an administrator"
              : "Registering as a team member"}
          </p>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="space-y-4 text-left">
            <Controller
              name="role"
              control={control}
              render={({ field }) => <RoleSelect value={field.value} onChange={field.onChange} id="register-role" />}
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Name</label>
              <Input autoComplete="name" {...register("name")} />
              {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Email</label>
              <Input type="email" autoComplete="email" {...register("email")} />
              {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Password</label>
              <Input type="password" autoComplete="new-password" {...register("password")} />
              {errors.password ? (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Confirm password</label>
              <Input type="password" autoComplete="new-password" {...register("confirm")} />
              {errors.confirm ? (
                <p className="mt-1 text-xs text-red-600">{errors.confirm.message}</p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-[var(--color-accent)] hover:underline">
              Sign in
            </Link>
            {" · "}
            <Link to="/" className="font-medium text-[var(--color-accent)] hover:underline">
              Back
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}


