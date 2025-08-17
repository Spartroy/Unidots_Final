/**
 * Comprehensive ResizeObserver error handling utility
 * This file provides a robust solution to suppress ResizeObserver loop errors
 * that commonly occur in React applications with rapid DOM changes.
 */

// Flag to prevent multiple initializations
let isInitialized = false;

export const initializeResizeObserverFix = () => {
  if (isInitialized) {
    return;
  }

  isInitialized = true;

  // Suppress console.error for ResizeObserver
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver loop completed with undelivered notifications')) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Suppress console.warn for ResizeObserver
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver')) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  // Handle window error events
  const originalAddEventListener = window.addEventListener;
  window.addEventListener = function(type, listener, options) {
    if (type === 'error') {
      const wrappedListener = function(event) {
        if (event.message && event.message.includes('ResizeObserver loop completed with undelivered notifications')) {
          event.preventDefault();
          return false;
        }
        return listener.call(this, event);
      };
      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('ResizeObserver loop completed with undelivered notifications')) {
      event.preventDefault();
      return false;
    }
  });

  // Override ResizeObserver to handle errors gracefully
  if (typeof ResizeObserver !== 'undefined') {
    const OriginalResizeObserver = ResizeObserver;
    ResizeObserver = function(callback) {
      const wrappedCallback = (...args) => {
        try {
          callback.apply(this, args);
        } catch (error) {
          if (error.message && error.message.includes('ResizeObserver loop completed with undelivered notifications')) {
            // Silently ignore this error
            return;
          }
          throw error;
        }
      };
      return new OriginalResizeObserver(wrappedCallback);
    };
    ResizeObserver.prototype = OriginalResizeObserver.prototype;
  }

  // Additional global error handler
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('ResizeObserver loop completed with undelivered notifications')) {
      event.preventDefault();
      return false;
    }
  });

  // Suppress React development warnings about ResizeObserver
  if (process.env.NODE_ENV === 'development') {
    const originalReactWarn = console.warn;
    console.warn = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver')) {
        return;
      }
      originalReactWarn.apply(console, args);
    };
  }

  // Additional fix for React StrictMode double rendering
  if (process.env.NODE_ENV === 'development') {
    // Suppress React warnings about ResizeObserver in development
    const originalReactError = console.error;
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver')) {
        return;
      }
      originalReactError.apply(console, args);
    };
  }

  // Fix for rapid DOM changes that might cause ResizeObserver loops
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = function(callback) {
    return originalRequestAnimationFrame.call(this, (...args) => {
      try {
        callback.apply(this, args);
      } catch (error) {
        if (error.message && error.message.includes('ResizeObserver loop completed with undelivered notifications')) {
          return;
        }
        throw error;
      }
    });
  };

  // Fix for setTimeout/setInterval that might trigger ResizeObserver
  const originalSetTimeout = window.setTimeout;
  window.setTimeout = function(callback, delay, ...args) {
    return originalSetTimeout.call(this, (...callbackArgs) => {
      try {
        callback.apply(this, callbackArgs);
      } catch (error) {
        if (error.message && error.message.includes('ResizeObserver loop completed with undelivered notifications')) {
          return;
        }
        throw error;
      }
    }, delay, ...args);
  };

  const originalSetInterval = window.setInterval;
  window.setInterval = function(callback, delay, ...args) {
    return originalSetInterval.call(this, (...callbackArgs) => {
      try {
        callback.apply(this, callbackArgs);
      } catch (error) {
        if (error.message && error.message.includes('ResizeObserver loop completed with undelivered notifications')) {
          return;
        }
        throw error;
      }
    }, delay, ...args);
  };
};

// Auto-initialize when this module is imported
initializeResizeObserverFix();

export default initializeResizeObserverFix;
