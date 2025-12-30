/**
 * Main Server File
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';
import { swaggerConfig, swaggerUiConfig } from './config/swagger.js';
import registerRoutes from './routes/index.js';
import { testConnection, closePool } from './config/database.js';
import multipart from '@fastify/multipart';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    } : undefined
  }
});

// Register plugins
async function build() {
  // JWT 인증 플러그인
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  });

  // Security plugins
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    }
  });

  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? ['http://setlone.com', 'http://www.setlone.com', 'https://setlone.com', 'https://www.setlone.com']
      : true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  // File upload support
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  });

  // Swagger/OpenAPI documentation
  await fastify.register(swagger, swaggerConfig);
  await fastify.register(swaggerUi, swaggerUiConfig);

  // Serve static files (uploads)
  await fastify.register((await import('@fastify/static')).default, {
    root: path.join(__dirname, '../uploads'),
    prefix: '/uploads/'
  });

  // 인증 미들웨어 등록
  const { authenticate } = await import('./middleware/auth.js');
  fastify.decorate('authenticate', async (request, reply) => {
    return authenticate(request, reply);
  });

  // Register routes
  await registerRoutes(fastify);

  // Root endpoint
  fastify.get('/', {
    schema: {
      description: 'API root endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Setlone API' },
            version: { type: 'string', example: '1.0.0' },
            docs: { type: 'string', example: '/docs' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      message: 'Setlone API',
      version: '1.0.0',
      docs: '/docs'
    };
  });

  // 404 handler
  fastify.setNotFoundHandler({
    schema: {
      description: '404 Not Found handler',
      tags: ['health']
    }
  }, async (request, reply) => {
    reply.code(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`
    });
  });

  // Error handler
  fastify.setErrorHandler(async (error, request, reply) => {
    fastify.log.error(error);
    
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    reply.code(statusCode).send({
      statusCode,
      error: error.name || 'Error',
      message
    });
  });

  return fastify;
}

// Start server
async function start() {
  try {
    // Test database connection before starting server
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Please check your database configuration.');
      process.exit(1);
    }
    console.log('✅ Database connection pool initialized');

    const server = await build();
    
    const host = process.env.HOST || '0.0.0.0';
    const port = parseInt(process.env.PORT || '3000', 10);

    await server.listen({ port, host });
    
    console.log(`🚀 Server is running on http://${host}:${port}`);
    console.log(`📚 API Documentation available at http://${host}:${port}/docs`);
    console.log(`🏥 Health check available at http://${host}:${port}/api/v1/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
async function shutdown() {
  console.log('\n🛑 Shutting down server...');
  try {
    await fastify.close();
    await closePool();
    console.log('✅ Server and database connections closed gracefully');
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
start();

