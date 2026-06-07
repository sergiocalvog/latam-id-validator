import { apiErrorResponse } from '../utils/response.js';

/**
 * Middleware to authenticate requests via API keys.
 * Checks header X-RapidAPI-Key and X-API-Key against API_KEYS env variable CSV.
 */
export async function apiKeyMiddleware(c, next) {
  const path = c.req.path;

  // Bypass authentication for the health check endpoint
  if (path.endsWith('/health') || path.endsWith('/health/')) {
    return await next();
  }

  const apiKeyHeader = c.req.header('X-RapidAPI-Key') || c.req.header('X-API-Key');
  const version = c.env.API_VERSION || '1.0.0';

  if (!apiKeyHeader) {
    return c.json(
      apiErrorResponse('UNAUTHORIZED', 'Invalid or missing API key', version),
      401
    );
  }

  const apiKeysStr = c.env.API_KEYS || '';
  const validKeys = apiKeysStr.split(',').map(key => key.trim()).filter(Boolean);

  if (!validKeys.includes(apiKeyHeader)) {
    return c.json(
      apiErrorResponse('UNAUTHORIZED', 'Invalid or missing API key', version),
      401
    );
  }

  // Store the api key and parsed plan (if provided) in the context
  c.set('apiKey', apiKeyHeader);
  
  // Set default plan to 'free' or extract it from header X-Plan
  const plan = (c.req.header('X-Plan') || 'free').toLowerCase();
  c.set('plan', plan);

  await next();
}
