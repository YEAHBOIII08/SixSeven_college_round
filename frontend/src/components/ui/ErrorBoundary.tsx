import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button, ButtonLink } from './Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base-950 flex items-center justify-center p-6 text-slate-100 font-sans">
          <div className="max-w-md w-full bg-base-900 border border-danger-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-danger-500/10 rounded-xl border border-danger-500/20 text-danger-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">
                  {this.props.fallbackTitle || 'Something went wrong'}
                </h2>
                <p className="text-xs text-slate-400">
                  An unexpected render error occurred in this view.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="bg-base-950 p-3 rounded-lg border border-base-800 text-xs font-mono text-danger-300 overflow-x-auto max-h-36">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" size="sm" onClick={this.handleReset}>
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Reload Page
              </Button>
              <ButtonLink variant="secondary" size="sm" to="/">
                <Home className="h-4 w-4 mr-1.5" />
                Return to Dashboard
              </ButtonLink>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
