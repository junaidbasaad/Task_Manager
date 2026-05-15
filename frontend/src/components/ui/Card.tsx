import { clsx } from "clsx";
import { forwardRef, type ForwardedRef, type ReactNode } from "react";

export const Card = forwardRef(function Card(
  { children, className }: { children: ReactNode; className?: string },
  ref: ForwardedRef<HTMLDivElement>,
) {
  return (
    <div
      ref={ref}
      className={clsx(
        "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </div>
  );
});
