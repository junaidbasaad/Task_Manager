export function Spinner({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
