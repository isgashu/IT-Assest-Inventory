const rateLimiters = {};
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 100;

module.exports = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  if (!rateLimiters[ip]) {
    rateLimiters[ip] = { count: 0, start: Date.now() };
  }
  const limiter = rateLimiters[ip];
  const elapsed = Date.now() - limiter.start;
  if (elapsed > RATE_LIMIT_WINDOW) {
    limiter.count = 0;
    limiter.start = Date.now();
  }
  limiter.count++;
  if (limiter.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests, please try again later' });
  }
  next();
};