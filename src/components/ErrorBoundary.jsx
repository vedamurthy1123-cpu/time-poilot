import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('TIME-PILOT Error Boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-on-background px-6 text-center">
          <span className="material-symbols-outlined text-error text-[72px] mb-4 opacity-80">
            error
          </span>
          <h1 className="text-2xl font-bold text-on-background mb-2">Something went wrong</h1>
          <p className="text-on-surface-variant text-sm mb-6 max-w-sm">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <p className="text-xs text-error/70 font-mono mb-6 max-w-md break-words">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">refresh</span>
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
