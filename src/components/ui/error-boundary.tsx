// src/components/ui/error-boundary.tsx
"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-slate-50">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4 opacity-80" />
          <h2 className="text-2xl font-bold text-slate-800">Something went wrong</h2>
          <p className="text-slate-500 mt-2 mb-8 max-w-md">
            An unexpected error occurred. Our team has been notified.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => window.location.reload()} variant="outline">
                Refresh Page
            </Button>
            <Button onClick={() => window.open('mailto:support@mindkindler.com')} className="bg-indigo-600 hover:bg-indigo-700">
                Contact Support
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-slate-800 text-red-100 rounded text-xs text-left w-full max-w-2xl overflow-auto border border-red-900">
                  <p className="font-bold mb-2">Debug Info:</p>
                  {this.state.error?.toString()}
              </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
