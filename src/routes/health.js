/**
 * Health Check Routes
 */
import { testConnection, getPoolStats } from '../config/database.js';

export default async function healthRoutes(fastify) {
  /**
   * @route GET /api/v1/health
   * @description Health check endpoint
   * @tags health
   * @response 200 - Health status
   */
  fastify.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            uptime: { type: 'number', example: 12345 },
            environment: { type: 'string', example: 'development' },
            database: { 
              type: 'object',
              properties: {
                connected: { type: 'boolean' },
                pool: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const dbConnected = await testConnection();
    const poolStats = getPoolStats();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: dbConnected,
        pool: poolStats
      }
    };
  });
}

