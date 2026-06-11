import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Catches uncaught render errors inside the routing tree so a single
 * exploded page doesn't take the whole app down. Logs to console for
 * now — when Sentry is wired in we'll forward `error` from here.
 */
export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("[RouteErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-3xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-display mb-2">
            Noget gik galt
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Vi har sendt fejlen videre. Prøv at genindlæse siden — kommer du tilbage til
            det samme sted, så skriv til os på info@hommies.dk.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => window.location.reload()} className="rounded-full">
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Genindlæs
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
              className="rounded-full"
            >
              <Home className="w-4 h-4 mr-1.5" />
              Forside
            </Button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-6 text-left text-xs bg-muted/50 rounded-xl p-3 overflow-auto max-h-40">
              {this.state.error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
