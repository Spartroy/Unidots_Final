import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Check if this is a ResizeObserver error
    if (error && error.message && error.message.includes('ResizeObserver loop completed with undelivered notifications')) {
      // Don't set hasError for ResizeObserver errors, just log and continue
      console.warn('ResizeObserver error caught by ErrorBoundary:', error.message);
      return { hasError: false, error: null, errorInfo: null };
    }
    
    // For other errors, set the error state
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    // Check if this is a ResizeObserver error
    if (error && error.message && error.message.includes('ResizeObserver loop completed with undelivered notifications')) {
      // Log ResizeObserver errors but don't treat them as fatal
      console.warn('ResizeObserver error handled:', error.message);
      return;
    }

    // Log other errors
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Set error info for debugging
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  componentDidMount() {
    // Handle unhandled promise rejections for ResizeObserver
    this.unhandledRejectionHandler = (event) => {
      if (event.reason && event.reason.message && event.reason.message.includes('ResizeObserver loop completed with undelivered notifications')) {
        event.preventDefault();
        console.warn('ResizeObserver promise rejection handled:', event.reason.message);
        return false;
      }
    };

    window.addEventListener('unhandledrejection', this.unhandledRejectionHandler);
  }

  componentWillUnmount() {
    // Clean up event listener
    if (this.unhandledRejectionHandler) {
      window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Force a re-render
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
                <p className="text-sm text-gray-500 mt-1">
                  An unexpected error occurred. Please try refreshing the page.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={this.handleRetry}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Retry
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Go to Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer text-gray-600">Error Details</summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


