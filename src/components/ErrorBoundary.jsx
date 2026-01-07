import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Store error details in state for display
    this.setState({
      error,
      errorInfo
    });

    // Send to error tracking service (Sentry)
    try {
      // Dynamic import for ES modules
      import('../config/sentry.js').then(({ captureException }) => {
        captureException(error, { 
          contexts: { 
            react: { 
              componentStack: errorInfo.componentStack 
            } 
          } 
        });
      }).catch(() => {
        // Fallback to console if Sentry not available
        console.error('Error caught by boundary:', error, errorInfo);
      });
    } catch (err) {
      // Fallback to console if import fails
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  handleReload = () => {
    // Reset error boundary state and reload page
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--kc-navy-900)] text-white px-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-serif font-semibold text-[var(--kc-cream-100)]">
                Something went wrong
              </h1>
              <p className="text-sm md:text-base text-[var(--kc-cream-100)] opacity-80">
                We're sorry for the inconvenience. An unexpected error occurred.
              </p>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-left">
                <p className="text-xs font-mono text-red-300 mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs font-mono text-red-300/80">
                    <summary className="cursor-pointer mb-2">Stack trace</summary>
                    <pre className="overflow-auto max-h-40 text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)] font-semibold rounded-lg hover:bg-[var(--kc-gold-300)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 border border-[var(--kc-cream-100)]/30 text-[var(--kc-cream-100)] font-semibold rounded-lg hover:bg-[var(--kc-cream-100)]/10 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--kc-cream-100)] focus-visible:outline-offset-2"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

