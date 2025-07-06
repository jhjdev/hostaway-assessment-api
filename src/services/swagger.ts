/* eslint-disable @typescript-eslint/no-explicit-any */
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

export async function setupSwagger(fastify: any) {
  // Register Swagger
  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Hostaway Assessment API',
        description:
          'A secure weather API with user authentication and search history tracking',
        version: '1.0.0',
        contact: {
          name: 'API Support',
          email: 'support@hostaway.com',
        },
        license: {
          name: 'ISC',
        },
      },
      servers: [
        {
          url: 'http://localhost:4000',
          description: 'Development server',
        },
        {
          url: 'https://hostaway-assessment-api.onrender.com',
          description: 'Production server (Render.com)',
        },
      ],
      tags: [
        {
          name: 'Authentication',
          description: 'User authentication operations',
        },
        { name: 'Weather', description: 'Weather data and search history' },
        { name: 'Profile', description: 'User profile management' },
        { name: 'Health', description: 'System health and monitoring' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token obtained from login endpoint',
          },
        },
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              email: {
                type: 'string',
                format: 'email',
                example: 'user@example.com',
              },
              firstName: { type: 'string', example: 'John' },
              lastName: { type: 'string', example: 'Doe' },
              preferences: {
                type: 'object',
                properties: {
                  temperatureUnit: {
                    type: 'string',
                    enum: ['celsius', 'fahrenheit'],
                    example: 'celsius',
                  },
                  theme: {
                    type: 'string',
                    enum: ['light', 'dark', 'system'],
                    example: 'system',
                  },
                  notifications: { type: 'boolean', example: true },
                },
              },
            },
          },
          WeatherData: {
            type: 'object',
            properties: {
              location: { type: 'string', example: 'London' },
              temperature: { type: 'number', example: 15 },
              description: { type: 'string', example: 'partly cloudy' },
              humidity: { type: 'number', example: 65 },
              windSpeed: { type: 'number', example: 3.5 },
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2025-07-06T10:00:00.000Z',
              },
            },
          },
          SearchHistory: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              query: { type: 'string', example: 'London' },
              location: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'London' },
                  country: { type: 'string', example: 'GB' },
                  lat: { type: 'number', example: 51.5074 },
                  lon: { type: 'number', example: -0.1278 },
                },
              },
              weatherData: {
                type: 'object',
                properties: {
                  temperature: { type: 'number', example: 15 },
                  description: { type: 'string', example: 'partly cloudy' },
                  humidity: { type: 'number', example: 65 },
                  windSpeed: { type: 'number', example: 3.5 },
                  icon: { type: 'string', example: '03d' },
                },
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2025-07-06T10:00:00.000Z',
              },
            },
          },
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string', example: 'Bad Request' },
              message: { type: 'string', example: 'Validation failed' },
            },
          },
          SuccessResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: 'Operation completed successfully',
              },
            },
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
  });

  // Register Swagger UI
  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/api/v1/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
      defaultModelExpandDepth: 3,
      defaultModelsExpandDepth: 1,
      tryItOutEnabled: true,
    },
    uiHooks: {
      onRequest: function (_request: any, _reply: any, next: any) {
        next();
      },
      preHandler: function (_request: any, _reply: any, next: any) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header: any) => header,
    transformSpecification: (swaggerObject: any) => {
      // Add rate limiting information to the spec
      swaggerObject.info['x-rate-limit'] = '100 requests per minute per IP';
      swaggerObject.info['x-deployment'] = 'Render.com';
      return swaggerObject;
    },
  });

  // Alternative documentation routes
  fastify.get('/api/docs', async (_request: any, reply: any) => {
    return reply.redirect('/api/v1/docs');
  });

  fastify.get('/docs', async (_request: any, reply: any) => {
    return reply.redirect('/api/v1/docs');
  });

  // OpenAPI JSON endpoint
  fastify.get('/api/v1/openapi.json', async (_request: any, _reply: any) => {
    return fastify.swagger();
  });
}
