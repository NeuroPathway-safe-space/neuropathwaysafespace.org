export function requestLogger(req, _res, next) {
  const started = Date.now();

  req.on("finish", () => {
    const durationMs = Date.now() - started;
    const logLine = [
      req.method,
      req.originalUrl,
      `status=${req.res?.statusCode ?? "-"}`,
      `durationMs=${durationMs}`,
      req.requestId ? `requestId=${req.requestId}` : null,
    ]
      .filter(Boolean)
      .join(" ");
    console.log(logLine);
  });

  next();
}
