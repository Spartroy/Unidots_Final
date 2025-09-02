import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for automatic data refreshing at specified intervals
 * @param {Function} callback - Function to call on refresh
 * @param {number} interval - Interval in milliseconds (default: 60000ms)
 * @param {Array} dependencies - Dependencies array for the callback
 */
const useAutoRefresh = (callback, interval = 60000, dependencies = []) => {
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);
  const isExecutingRef = useRef(false);
  const abortControllerRef = useRef(null);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Memoize the callback to prevent unnecessary re-renders
  const memoizedCallback = useCallback(async () => {
    // Prevent multiple simultaneous executions
    if (isExecutingRef.current) {
      return;
    }

    try {
      isExecutingRef.current = true;
      
      // Create new abort controller for this execution
      abortControllerRef.current = new AbortController();

      // Execute callback with error handling
      const result = callbackRef.current();
      
      // If callback returns a promise, handle it
      if (result && typeof result.then === 'function') {
        await result;
      }
    } catch (error) {
      // Only log non-cancellation errors
      if (error.name !== 'AbortError') {
        console.error('Auto-refresh callback error:', error);
      }
    } finally {
      isExecutingRef.current = false;
    }
  }, dependencies);

  useEffect(() => {
    // Clear existing interval and timeout
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      // Add a small delay to prevent rapid successive calls
      timeoutRef.current = setTimeout(memoizedCallback, 100);
    }, interval);

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Abort any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [memoizedCallback, interval]);

  // Return cleanup function and abort controller for manual control
  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const getAbortController = useCallback(() => {
    return abortControllerRef.current;
  }, []);

  return { stopAutoRefresh, getAbortController };
};

export default useAutoRefresh;


