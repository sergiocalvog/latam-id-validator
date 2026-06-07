import { apiErrorResponse } from '../utils/response.js';

// Fallback in-memory KV mock for tests and environments without Cloudflare KV bound
const localKvMock = {
  store: new Map(),
  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  },
  async put(key, value, options = {}) {
    const expiresAt = options.expirationTtl ? Date.now() + options.expirationTtl * 1000 : null;
    this.store.set(key, { value: String(value), expiresAt });
  }
};

/**
 * Middleware for rate limiting via Cloudflare KV.
 * Blocks requests when they exceed the limit of their specific plan per minute.
 */
export async function rateLimitMiddleware(c, next) {
  const path = c.req.path;

  // Bypass rate limiting for health check
  if (path.endsWith('/health') || path.endsWith('/health/')) {
    return await next();
  }

  const apiKey = c.get('apiKey') || 'anonymous';
  const plan = c.get('plan') || 'free';
  const version = c.env.API_VERSION || '1.0.0';

  const limits = {
    free: 100,
    basic: 1000,
    pro: 10000,
    enterprise: Infinity
  };

  const limit = limits[plan] !== undefined ? limits[plan] : limits.free;

  // Skip limit checking if plan is enterprise (unlimited)
  if (limit === Infinity) {
    return await next();
  }

  const kv = c.env.RATE_LIMIT_KV || localKvMock;
  const currentMinute = Math.floor(Date.now() / 60000);
  const kvKey = `rl:${apiKey}:${currentMinute}`;

  try {
    const requestsCountStr = await kv.get(kvKey);
    const requestsCount = requestsCountStr ? parseInt(requestsCountStr, 10) : 0;

    if (requestsCount >= limit) {
      return c.json(
        apiErrorResponse('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Upgrade your plan.', version),
        429
      );
    }

    // Save/increment requests count with 120 seconds TTL
    await kv.put(kvKey, String(requestsCount + 1), { expirationTtl: 120 });
  } catch (error) {
    // Log error but proceed to prevent infrastructure blockages on API calls
    console.error('Rate Limiter KV error:', error);
  }

  await next();
}
