import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Modal } from "../components/ui/Modal";
import { Spinner } from "../components/ui/Spinner";
import * as api from "../api/services";
import type { Project } from "../types";
import { useAuth } from "../contexts/AuthContext";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const load = async () => {
    const list = await api.fetchProjects();
    setProjects(list);
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load projects");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onCreate = handleSubmit(async (values) => {
    try {
      await api.createProject({ title: values.title, description: values.description || null });
      toast.success("Project created");
      reset();
      setOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create project");
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-fg)]">Projects</h1>
          <p className="text-sm text-[var(--color-muted)]">Organize work across teams</p>
        </div>
        {user?.role === "ADMIN" ? (
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New project
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Link to={`/projects/${p.id}`}>
              <Card className="h-full transition hover:border-[var(--color-accent)]/40 hover:shadow-lg">
                <h2 className="text-lg font-semibold text-[var(--color-fg)]">{p.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-[var(--color-muted)]">{p.description || "No description"}</p>
                <div className="mt-4 flex gap-4 text-xs text-[var(--color-muted)]">
                  <span>{p._count?.members ?? 0} members</span>
                  <span>{p._count?.tasks ?? 0} tasks</span>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {projects.length === 0 ? (
        <Card className="text-center text-sm text-[var(--color-muted)]">No projects yet.</Card>
      ) : null}

      <Modal
        open={open}
        title="New project"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-project-form" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Create"}
            </Button>
          </>
        }
      >
        <form id="create-project-form" onSubmit={onCreate} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Title</label>
            <Input {...register("title")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Description</label>
            <Textarea {...register("description")} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
