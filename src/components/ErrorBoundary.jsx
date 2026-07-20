import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 bg-base-100 text-base-content font-sans">
          <div className="card w-full max-w-sm sm:max-w-md bg-base-200 border border-base-300 shadow-xl p-6 sm:p-8 text-center space-y-6">
            
            {/* Minimal DaisyUI Avatar / Badge Wrapper */}
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full border border-base-300 bg-base-300/50 flex items-center justify-center">
                <span className="text-lg font-mono font-bold text-warning">!</span>
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
                Something went wrong
              </h2>
              <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">
                An unexpected UI rendering error occurred. You can attempt to recover this section or reload the application.
              </p>
            </div>

            {/* DaisyUI Button Group */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="btn btn-outline btn-sm sm:btn-md font-medium tracking-wide uppercase text-xs"
              >
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary btn-sm sm:btn-md font-semibold tracking-wide uppercase text-xs"
              >
                Reload Page
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}