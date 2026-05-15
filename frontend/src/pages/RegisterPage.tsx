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

const schema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email(),
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords must match", path: ["confirm"] });

type Form = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: regUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await regUser(values.name, values.email, values.password);
      toast.success("Account created");
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
          <p className="mt-1 text-sm text-[var(--color-muted)]">Invite your team after signing up</p>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="space-y-4 text-left">
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
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
