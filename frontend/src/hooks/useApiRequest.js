import { useState, useEffect, useRef, useCallback } from 'react';
import { createCancellableRequest, isCancelledError } from '../utils/api';

/**
 * Custom hook for managing API requests with proper cancellation
 * Prevents race conditions and memory leaks
 */
export const useApiRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const abortControllerRef = useRef(null);
  const requestRef = useRef(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (requestRef.current) {
      requestRef.current.cancel();
      requestRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Execute API request
  const execute = useCallback(async (config) => {
    // Cancel any ongoing request
    cleanup();

    setLoading(true);
    setError(null);

    try {
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      // Create cancellable request
      requestRef.current = createCancellableRequest({
        ...config,
        signal: abortControllerRef.current.signal
      });

      const response = await requestRef.current.request;
      setData(response.data);
      return response.data;
    } catch (err) {
      // Don't set error for cancelled requests
      if (!isCancelledError(err) && err.name !== 'AbortError') {
        setError(err);
        console.error('API request error:', err);
      }
      throw err;
    } finally {
      setLoading(false);
      requestRef.current = null;
    }
  }, [cleanup]);

  // Cancel current request
  const cancel = useCallback(() => {
    cleanup();
    setLoading(false);
    setError(null);
  }, [cleanup]);

  // Reset state
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    cancel,
    reset
  };
};

export default useApiRequest;
