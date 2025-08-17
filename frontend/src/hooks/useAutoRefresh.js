import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for automatic data refreshing at specified intervals
 * @param {Function} callback - Function to call on refresh
 * @param {number} interval - Interval in milliseconds (default: 60000ms)
 * @param {Array} dependencies - Dependencies array for the callback
 */
const useAutoRefresh = (callback, interval = 60000, dependencies = []) => {
  const intervalRef = useRef(null);
  const callbackRef = useRef(callback);
  const isExecutingRef = useRef(false);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Memoize the callback to prevent unnecessary re-renders
  const memoizedCallback = useCallback(() => {
    // Prevent multiple simultaneous executions
    if (isExecutingRef.current) {
      return;
    }

    try {
      isExecutingRef.current = true;

      // Suppress ResizeObserver errors during callback execution
      const originalError = console.error;
      const originalWarn = console.warn;
      
      console.error = (...args) => {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver loop completed with undelivered notifications')) {
          return;
        }
        originalError.apply(console, args);
      };

      console.warn = (...args) => {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver')) {
          return;
        }
        originalWarn.apply(console, args);
      };

      // Execute callback with error handling
      const result = callbackRef.current();
      
      // If callback returns a promise, handle it
      if (result && typeof result.then === 'function') {
        result.catch((error) => {
          console.warn('Auto-refresh callback promise error:', error);
        });
      }

      // Restore original console methods
      console.error = originalError;
      console.warn = originalWarn;
    } catch (error) {
      // Handle any errors during callback execution
      console.warn('Auto-refresh callback error:', error);
    } finally {
      isExecutingRef.current = false;
    }
  }, dependencies);

  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval with debouncing
    intervalRef.current = setInterval(() => {
      // Add a small delay to prevent rapid successive calls
      setTimeout(memoizedCallback, 100);
    }, interval);

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [memoizedCallback, interval]);

  // Return cleanup function for manual control
  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return { stopAutoRefresh };
};

export default useAutoRefresh;


