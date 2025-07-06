import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyJWT from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyEnv from '@fastify/env';
import { mongoose } from '../services/database';

export function build() {
  const fastify = Fastify({ logger: false }); // Disable logging for tests

  // Register plugins
  fastify.register(async function (fastify) {
    // Register environment variables
    await fastify.register(fastifyEnv, {
      dotenv: { path: '.env.test' },
      schema: {
        type: 'object',
        required: ['JWT_SECRET'],
        properties: {
          MONGODB_URI: { type: 'string' },
          MONGODB_DB_NAME: { type: 'string' },
          PORT: { type: 'string', default: '4001' },
          OPENWEATHER_API_KEY: { type: 'string' },
          OPENWEATHER_API_URL: { type: 'string' },
          JWT_SECRET: { type: 'string' },
        },
      },
      confKey: 'config',
    });

    // Register security plugins
    await fastify.register(fastifyHelmet);
    await fastify.register(fastifyCors, { origin: '*' });
    await fastify.register(fastifyRateLimit, {
      max: 1000,
      timeWindow: '1 minute',
    });

    // Register JWT
    await fastify.register(fastifyJWT, {
      secret: fastify.config.JWT_SECRET,
    });

    // Database connection is handled by the test setup
    fastify.decorate('mongo', mongoose.connection);

    // Register routes
    const authRoutes = await import('../routes/auth');
    const weatherRoutes = await import('../routes/weather');
    const profileRoutes = await import('../routes/profile');

    fastify.register(authRoutes.default, { prefix: '/api/auth' });
    fastify.register(weatherRoutes.default, { prefix: '/api/weather' });
    fastify.register(profileRoutes.default, { prefix: '/api/profile' });

    // Test routes
    fastify.get('/', async (_request, reply) => {
      return reply.send({ message: 'Test API' });
    });

    fastify.get('/api/health', async (_request, reply) => {
      return reply.send({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      });
    });
  });

  return fastify;
}
