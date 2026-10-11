import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleCopyDetails = () => {
    const errorText = `Error: ${this.state.error?.message || 'Unknown'}\nStack: ${this.state.error?.stack || ''}\nComponentStack: ${this.state.errorInfo?.componentStack || ''}`;
    navigator.clipboard.writeText(errorText);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 3000);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] bg-white rounded-2xl border border-rose-200 shadow-xl p-6 sm:p-10 max-w-2xl mx-auto my-8 flex flex-col items-center text-center font-sans">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#1B262C] mb-2">
            {this.props.fallbackTitle || 'Something went wrong on this screen'}
          </h2>
          <p className="text-sm text-gray-600 mb-6 max-w-md">
            {this.state.error?.message || 'An unexpected rendering error occurred. Your data in Firestore is safe.'}
          </p>

          <div className="w-full bg-gray-50 rounded-xl p-4 text-left font-mono text-xs text-rose-800 border border-rose-200 overflow-x-auto max-h-48 mb-6">
            <p className="font-bold mb-1">{this.state.error?.toString()}</p>
            <pre className="whitespace-pre-wrap text-[11px] text-gray-700">
              {this.state.errorInfo?.componentStack || this.state.error?.stack || 'No stack trace available.'}
            </pre>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleCopyDetails}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs transition cursor-pointer"
            >
              {this.state.copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
              <span>{this.state.copied ? 'Copied Details' : 'Copy details'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D35400] hover:bg-[#A04000] text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Back to list / Reload</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
