import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyJWT from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyEnv from '@fastify/env';
import { MongoClient } from 'mongodb';

const fastify = Fastify({ logger: true });

// Global MongoDB client
let client: MongoClient;

async function registerPlugins() {
  // Register environment variables first
  await fastify.register(fastifyEnv, {
    dotenv: process.env.NODE_ENV === 'production' ? false : {
      path: '.env.development'
    },
    schema: {
      type: 'object',
      required: ['MONGODB_URI', 'MONGODB_DB_NAME', 'PORT', 'JWT_SECRET'],
      properties: {
        MONGODB_URI: { type: 'string' },
        MONGODB_DB_NAME: { type: 'string' },
        PORT: { type: 'string', default: '4000' },
        OPENWEATHER_API_KEY: { type: 'string' },
        OPENWEATHER_API_URL: { type: 'string' },
        JWT_SECRET: { type: 'string' }
      }
    },
    confKey: 'config'
  });
  
  
  // Register security tools
  fastify.register(fastifyHelmet);
  fastify.register(fastifyCors, { origin: "*" });
  fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

}

async function setupJWT() {
  // Register JWT after environment is loaded
  if (!fastify.config.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment configuration');
  }
  
  await fastify.register(fastifyJWT, {
    secret: fastify.config.JWT_SECRET
  });
}

async function setupDatabase() {
  // Connect to MongoDB after environment is loaded
  // Use proper TLS options for Atlas connectivity
  const options = {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000
  };
  
  try {
    console.log('Attempting MongoDB connection with basic options');
    client = await MongoClient.connect(fastify.config.MONGODB_URI, options);
    console.log('MongoDB connection successful');
    fastify.decorate('mongo', client.db(fastify.config.MONGODB_DB_NAME));
    console.log('Database decorated successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

// Register routes
fastify.register(async function (fastify) {
  const authRoutes = await import('./routes/auth');
  const weatherRoutes = await import('./routes/weather');
  const profileRoutes = await import('./routes/profile');
  
  fastify.register(authRoutes.default, { prefix: '/api/auth' });
  fastify.register(weatherRoutes.default, { prefix: '/api/weather' });
  fastify.register(profileRoutes.default, { prefix: '/api/profile' });
});

// Root route
fastify.get('/', async (request, reply) => {
  return { 
    message: 'Hostaway Assessment API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      weather: '/api/weather',
      profile: '/api/profile',
      health: '/api/weather/health'
    },
    features: [
      'User authentication with JWT',
      'Weather data from OpenWeather API',
      'Search history tracking',
      'User profile management',
      'Secure password hashing',
      'Rate limiting and security headers'
    ]
  };
});

// Start server
const start = async (): Promise<void> => {
  try {
    // Register plugins
    await registerPlugins();
    
    // Setup JWT authentication
    await setupJWT();
    
    // Setup database connection
    await setupDatabase();

    const port = parseInt(fastify.config.PORT, 10);
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Run the server
start();

process.on('SIGINT', async () => {
  await client.close();
  process.exit(0);
});

