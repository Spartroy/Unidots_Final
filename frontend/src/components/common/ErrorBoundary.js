import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Uncaught error:', error, info);
  }

  handleReload = () => {
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
          <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">Please try reloading the page. If the problem persists, sign in again.</p>
          <div className="flex gap-3">
            <button onClick={this.handleReload} className="px-4 py-2 rounded bg-primary-600 text-white">Go to Home</button>
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded border">Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;


