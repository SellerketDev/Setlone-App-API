/**
 * Swagger/OpenAPI Configuration
 */
export const swaggerConfig = {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Setlone API',
      description: 'Setlone Platform API Documentation',
      version: '1.0.0',
      contact: {
        name: 'Setlone API Support',
        email: 'support@setlone.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.setlone.com',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'auth',
        description: 'Authentication endpoints'
      },
      {
        name: 'users',
        description: 'User management endpoints'
      },
      {
        name: 'posts',
        description: 'Post management endpoints'
      },
      {
        name: 'health',
        description: 'Health check endpoints'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            statusCode: {
              type: 'number',
              example: 400
            },
            error: {
              type: 'string',
              example: 'Bad Request'
            },
            message: {
              type: 'string',
              example: 'Error message'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object'
            }
          }
        }
      }
    }
  }
};

export const swaggerUiConfig = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
  exposeRoute: true
};

