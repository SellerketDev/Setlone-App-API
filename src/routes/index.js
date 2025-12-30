/**
 * Main Routes Registration
 */
import healthRoutes from './health.js';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import tradingRoutes from './trading.js';
import stockRoutes from './stock.js';

export default async function registerRoutes(fastify) {
  // Register all routes
  await fastify.register(healthRoutes, { prefix: '/api/v1' });
  await fastify.register(authRoutes, { prefix: '/api/v1' });
  await fastify.register(userRoutes, { prefix: '/api/v1' });
  await fastify.register(tradingRoutes, { prefix: '/api/v1' });
  await fastify.register(stockRoutes, { prefix: '/api/v1' });
  
  // Add more route modules here as they are created
  // await fastify.register(postRoutes, { prefix: '/api/v1/posts' });
}

