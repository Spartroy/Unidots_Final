/**
 * Utility to handle ResizeObserver errors gracefully
 * This prevents ResizeObserver errors from crashing the application
 * while preserving legitimate error reporting
 */

let isInitialized = false;

export const initializeResizeObserverHandler = () => {
  if (isInitialized || typeof window === 'undefined') {
    return;
  }

  isInitialized = true;

  // Handle ResizeObserver errors without suppressing other errors
  const handleResizeObserverError = (event) => {
    if (event.message && event.message.includes('ResizeObserver loop completed with undelivered notifications')) {
      // Prevent ResizeObserver errors from being treated as fatal
      event.preventDefault();
      return false;
    }
  };

  // Handle unhandled promise rejections for ResizeObserver
  const handleUnhandledRejection = (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('ResizeObserver loop completed with undelivered notifications')) {
      event.preventDefault();
      return false;
    }
  };

  // Add global error handlers
  window.addEventListener('error', handleResizeObserverError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  // Return cleanup function
  return () => {
    window.removeEventListener('error', handleResizeObserverError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  };
};

export default initializeResizeObserverHandler;
