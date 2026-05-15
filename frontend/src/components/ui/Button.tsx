import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    primary:
      "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:opacity-95 shadow-sm",
    secondary:
      "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]",
    ghost: "text-[var(--color-muted)] hover:text-[var(--color-fg)] hover:bg-black/5 dark:hover:bg-white/5",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button
      type="button"
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
