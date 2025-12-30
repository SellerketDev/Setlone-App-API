/**
 * Trading Routes
 * AI Auto Trading API endpoints
 */
import { query, transaction } from '../config/database.js';

export default async function tradingRoutes(fastify) {
  /**
   * @route GET /api/v1/trading/strategies
   * @description Get available AI trading strategies
   * @tags trading
   * @response 200 - List of available strategies
   */
  fastify.get('/trading/strategies', {
    schema: {
      description: 'Get list of available AI trading strategies',
      tags: ['trading'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const strategies = [
      {
        id: 'momentum',
        name: 'Momentum Strategy',
        description: 'Short-term trading using price momentum'
      },
      {
        id: 'mean_reversion',
        name: 'Mean Reversion Strategy',
        description: 'Trading using mean price reversion'
      },
      {
        id: 'trend_following',
        name: 'Trend Following Strategy',
        description: 'Medium to long-term trend following'
      }
    ];

    return reply.send({
      success: true,
      data: strategies
    });
  });

  /**
   * @route POST /api/v1/trading/start
   * @description Start AI auto trading
   * @tags trading
   * @body {string} symbol - Trading symbol
   * @body {string} strategy - Strategy ID
   * @body {number} initialBalance - Initial balance
   * @response 200 - Trading started successfully
   */
  fastify.post('/trading/start', {
    schema: {
      description: 'Start AI auto trading session',
      tags: ['trading'],
      security: [{ BearerAuth: [] }],
      body: {
        type: 'object',
        required: ['symbol', 'strategy'],
        properties: {
          symbol: { type: 'string' },
          strategy: { type: 'string' },
          initialBalance: { type: 'number', default: 10000 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                sessionId: { type: 'string' },
                symbol: { type: 'string' },
                strategy: { type: 'string' }
              }
            }
          }
        }
      }
    },
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { symbol, strategy, initialBalance = 10000 } = request.body;
    const userId = request.user.id;

    // TODO: 실제로는 데이터베이스에 트레이딩 세션 저장
    const sessionId = `session_${Date.now()}_${userId}`;

    return reply.send({
      success: true,
      message: 'AI trading started',
      data: {
        sessionId,
        symbol,
        strategy
      }
    });
  });

  /**
   * @route POST /api/v1/trading/stop
   * @description Stop AI auto trading
   * @tags trading
   * @body {string} sessionId - Trading session ID
   * @response 200 - Trading stopped successfully
   */
  fastify.post('/trading/stop', {
    schema: {
      description: 'Stop AI auto trading session',
      tags: ['trading'],
      security: [{ BearerAuth: [] }],
      body: {
        type: 'object',
        required: ['sessionId'],
        properties: {
          sessionId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { sessionId } = request.body;
    const userId = request.user.id;

    // TODO: 실제로는 데이터베이스에서 트레이딩 세션 종료 처리

    return reply.send({
      success: true,
      message: 'AI trading stopped'
    });
  });

  /**
   * @route GET /api/v1/trading/history
   * @description Get trading history
   * @tags trading
   * @query {string} sessionId - Trading session ID (optional)
   * @query {number} limit - Number of records to return (default: 50)
   * @response 200 - Trading history
   */
  fastify.get('/trading/history', {
    schema: {
      description: 'Get trading history for user',
      tags: ['trading'],
      security: [{ BearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' },
          limit: { type: 'number', default: 50 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  symbol: { type: 'string' },
                  action: { type: 'string' },
                  price: { type: 'number' },
                  amount: { type: 'number' },
                  profit: { type: 'number' },
                  timestamp: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.id;
    const { sessionId, limit = 50 } = request.query;

    // TODO: 실제로는 데이터베이스에서 거래 내역 조회
    // 현재는 빈 배열 반환
    const history = [];

    return reply.send({
      success: true,
      data: history
    });
  });

  /**
   * @route GET /api/v1/trading/stats
   * @description Get trading statistics
   * @tags trading
   * @query {string} sessionId - Trading session ID (optional)
   * @response 200 - Trading statistics
   */
  fastify.get('/trading/stats', {
    schema: {
      description: 'Get trading statistics for user',
      tags: ['trading'],
      security: [{ BearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalTrades: { type: 'number' },
                winRate: { type: 'number' },
                totalProfit: { type: 'number' },
                profitPercent: { type: 'number' }
              }
            }
          }
        }
      }
    },
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.id;
    const { sessionId } = request.query;

    // TODO: 실제로는 데이터베이스에서 통계 계산
    const stats = {
      totalTrades: 0,
      winRate: 0,
      totalProfit: 0,
      profitPercent: 0
    };

    return reply.send({
      success: true,
      data: stats
    });
  });
}

