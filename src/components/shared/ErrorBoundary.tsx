import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render errors so one broken panel never takes the whole app down.
 * The fallback is written in the app's own tokens (calm surface, teal primary),
 * not a generic red screen — a practitioner seeing this should feel "try again",
 * not "something is on fire".
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private reset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-16 text-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive-strong">
            <AlertTriangle size={22} strokeWidth={1.75} />
          </div>

          <div className="max-w-md space-y-1">
            <h2 className="text-section-title">Something went wrong</h2>
            <p className="text-meta">
              This view hit an unexpected error. Your data is safe — reload the
              panel or go back to the dashboard to keep working.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={this.reset} className="h-10 rounded-lg px-4 text-sm font-medium">
              <RotateCcw size={15} className="mr-1.5" /> Try again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="h-10 rounded-lg px-4 text-sm font-medium"
            >
              <RefreshCw size={15} className="mr-1.5" /> Reload
            </Button>
            <Button
              variant="ghost"
              onClick={() => (window.location.href = "/")}
              className="h-10 rounded-lg px-4 text-sm font-medium text-muted-foreground"
            >
              <Home size={15} className="mr-1.5" /> Dashboard
            </Button>
          </div>

          {this.state.error?.message && (
            <details className="mt-1 max-w-lg text-left">
              <summary className="cursor-pointer text-[12px] font-medium text-muted-foreground hover:text-foreground">
                Technical details
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-border bg-muted/50 p-3 text-left text-[11px] leading-relaxed text-muted-foreground">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
