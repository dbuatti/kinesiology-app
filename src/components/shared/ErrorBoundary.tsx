
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in fade-in duration-500">
          <div className="w-20 h-20 rounded-[2rem] bg-rose-50 flex items-center justify-center text-rose-600 shadow-xl shadow-rose-100">
            <AlertTriangle size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Something went wrong</h2>
            <p className="text-slate-500 max-w-md mx-auto font-medium">
              The clinical engine encountered an unexpected error. Your data is safe, but the view needs to be reset.
            </p>
            {this.state.error && (
              <pre className="mt-4 p-4 bg-slate-50 rounded-xl text-[10px] font-mono text-rose-600 overflow-auto max-w-lg mx-auto border border-rose-100">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => window.location.reload()}
              className="bg-indigo-600 hover:bg-indigo-700 rounded-xl h-12 px-8 font-bold"
            >
              <RefreshCw size={18} className="mr-2" /> Reload System
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="rounded-xl h-12 px-8 font-bold border-slate-200"
            >
              <Home size={18} className="mr-2" /> Back to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;