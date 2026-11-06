// Receives JavaScript errors from the browser so they show up in the server logs (Render, Railway, etc.).
const cut = (v, n) => (typeof v === 'string' ? v.slice(0, n) : undefined);

export const reportClientError = (req, res) => {
  const { message, stack, url, source } = req.body || {};
  console.error(
    '[client-error]',
    JSON.stringify({
      message: cut(message, 500),
      source: cut(source, 40),
      url: cut(url, 300),
      stack: cut(stack, 1500),
      userAgent: cut(req.headers['user-agent'], 200),
      at: new Date().toISOString(),
    })
  );
  res.status(204).end();
};
