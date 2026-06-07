import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { apiKeyMiddleware } from './middleware/apiKey.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import validateRoutes from './routes/validate.js';

const app = new Hono();

// Global middlewares
app.use('*', cors());
app.use('*', logger());

// Auth & Rate Limit middlewares applied to v1 endpoints (excluding health check internally)
app.use('/v1/*', apiKeyMiddleware);
app.use('/v1/*', rateLimitMiddleware);

// API Routing
app.route('/v1', validateRoutes);

export default app;
