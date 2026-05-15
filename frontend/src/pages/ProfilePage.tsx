import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Spinner } from "../components/ui/Spinner";
import { useAuth } from "../contexts/AuthContext";
import * as api from "../api/services";
import { mediaUrl } from "../utils/mediaUrl";

const schema = z
  .object({
    name: z.string().min(1),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).optional().or(z.literal("")),
    confirm: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword && data.newPassword !== data.confirm) {
      ctx.addIssue({ code: "custom", message: "Passwords must match", path: ["confirm"] });
    }
    if (data.newPassword && !data.currentPassword) {
      ctx.addIssue({ code: "custom", message: "Current password required", path: ["currentPassword"] });
    }
  });

type Form = z.infer<typeof schema>;

export function ProfilePage() {
  const { user, refreshUser, setUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    values: user ? { name: user.name, currentPassword: "", newPassword: "", confirm: "" } : undefined,
  });

  useEffect(() => {
    if (user) {
      reset({ name: user.name, currentPassword: "", newPassword: "", confirm: "" });
    }
  }, [user, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updated = await api.updateProfile({
        name: values.name,
        currentPassword: values.currentPassword || undefined,
        newPassword: values.newPassword || undefined,
      });
      setUser(updated);
      toast.success("Profile saved");
      reset({
        name: updated.name,
        currentPassword: "",
        newPassword: "",
        confirm: "",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  });

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const updated = await api.uploadProfileImage(file);
      setUser(updated);
      await refreshUser();
      toast.success("Photo updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  const avatar = mediaUrl(user.profileImage);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-fg)]">Profile</h1>
        <p className="text-sm text-[var(--color-muted)]">Manage your identity and security</p>
      </div>

      <Card>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <img
            src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
            alt=""
            className="h-24 w-24 rounded-2xl border border-[var(--color-border)] object-cover"
          />
          <div className="flex flex-1 flex-col gap-2">
            <div className="text-sm text-[var(--color-muted)]">
              Signed in as <span className="font-medium text-[var(--color-fg)]">{user.email}</span>
            </div>
            <div className="text-xs uppercase text-[var(--color-muted)]">Role: {user.role}</div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--color-accent)]">
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] || null)}
              />
              {uploading ? "Uploading…" : "Change photo"}
            </label>
          </div>
        </div>
      </Card>

      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Display name</label>
            <Input {...register("name")} />
            {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
          </div>
          <div className="border-t border-[var(--color-border)] pt-4">
            <h2 className="mb-2 text-sm font-semibold text-[var(--color-fg)]">Change password</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Current password</label>
                <Input type="password" autoComplete="current-password" {...register("currentPassword")} />
                {errors.currentPassword ? (
                  <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message as string}</p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">New password</label>
                <Input type="password" autoComplete="new-password" {...register("newPassword")} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Confirm new password</label>
                <Input type="password" autoComplete="new-password" {...register("confirm")} />
                {errors.confirm ? <p className="mt-1 text-xs text-red-600">{errors.confirm.message as string}</p> : null}
              </div>
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </Card>

      <p className="text-center text-xs text-[var(--color-muted)]">
        {user.createdAt
          ? `Member since ${format(parseISO(user.createdAt), "MMMM yyyy")}`
          : null}
      </p>
    </div>
  );
}
