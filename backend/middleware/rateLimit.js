function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

function createRateLimiter({ windowMs, maxRequests, message, keyGenerator }) {
  const entries = new Map();

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const key = keyGenerator(req);
    const current = entries.get(key);

    if (!current || current.expiresAt <= now) {
      entries.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    current.count += 1;

    if (current.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((current.expiresAt - now) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds);
      return res.status(429).json({ error: message });
    }

    return next();
  };
}

module.exports = {
  createRateLimiter,
  getClientIp,
};
