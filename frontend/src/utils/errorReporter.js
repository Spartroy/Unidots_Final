import api from './api';

// Sends browser errors to the backend (POST /api/client-errors) so they appear in the server logs.
// Best effort only: reporting must never break the app, and noise is filtered and capped.
const IGNORED = [/ResizeObserver loop/i, /Script error\.?$/i, /Request cancelled/i, /AbortError/i];
const MAX_REPORTS_PER_PAGE_LOAD = 10;
const seen = new Set();

export const reportError = (error, source = 'window') => {
  try {
    const message = String(error?.message || error || 'Unknown error');
    if (IGNORED.some((re) => re.test(message))) return;
    if (seen.size >= MAX_REPORTS_PER_PAGE_LOAD || seen.has(message)) return;
    seen.add(message);
    api
      .post('/api/client-errors', {
        message,
        stack: error?.stack,
        url: window.location.href,
        source,
      })
      .catch(() => {});
  } catch (_) {
    /* never throw from the reporter */
  }
};

export const installGlobalErrorReporting = () => {
  window.addEventListener('error', (e) => reportError(e.error || e.message, 'window.onerror'));
  window.addEventListener('unhandledrejection', (e) => reportError(e.reason, 'unhandledrejection'));
};
