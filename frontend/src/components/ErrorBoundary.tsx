import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };

type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI error boundary:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-surface-2)] p-6 text-center">
          <h1 className="text-lg font-semibold text-[var(--color-fg)]">Something went wrong</h1>
          <p className="mt-2 max-w-md text-sm text-[var(--color-muted)]">
            The application hit an unexpected error. Refresh the page, or try again in a moment.
          </p>
          {import.meta.env.DEV && this.state.message ? (
            <pre className="mt-4 max-w-lg overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left text-xs text-red-600">
              {this.state.message}
            </pre>
          ) : null}
          <button
            type="button"
            className="mt-6 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-foreground)]"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
