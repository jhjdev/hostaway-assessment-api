/* eslint-disable @typescript-eslint/no-explicit-any */

// API Version configuration
export const API_VERSIONS = {
  V1: 'v1',
  CURRENT: 'v1',
  SUPPORTED: ['v1'],
  DEPRECATED: [] as string[],
} as const;

export type ApiVersion = typeof API_VERSIONS.V1;

// Version validation middleware
export function validateApiVersion(version: string): version is ApiVersion {
  return API_VERSIONS.SUPPORTED.includes(version as ApiVersion);
}

// Register versioned routes
export async function registerVersionedRoutes(fastify: any) {
  // V1 Routes (current version)
  await fastify.register(
    async function (fastify: any) {
      // Import V1 route handlers
      const authRoutes = await import('../routes/v1/auth');
      const weatherRoutes = await import('../routes/v1/weather');
      const weatherEnhancedRoutes = await import(
        '../routes/v1/weatherEnhanced'
      );
      const profileRoutes = await import('../routes/v1/profile');

      // Register V1 routes
      fastify.register(authRoutes.default, { prefix: '/auth' });
      fastify.register(weatherRoutes.default, { prefix: '/weather' });
      fastify.register(weatherEnhancedRoutes.default, { prefix: '/weather' });
      fastify.register(profileRoutes.default, { prefix: '/profile' });

      // V1 Info endpoint
      fastify.get('/', async (_request: any, _reply: any) => {
        return {
          version: 'v1',
          status: 'stable',
          description: 'Hostaway Assessment API v1',
          endpoints: {
            auth: '/api/v1/auth',
            weather: '/api/v1/weather',
            'weather-enhanced': {
              'current-enhanced': '/api/v1/weather/current/enhanced',
              'hourly-forecast': '/api/v1/weather/hourly',
              'air-quality': '/api/v1/weather/air-quality',
              'weather-alerts': '/api/v1/weather/alerts',
            },
            profile: '/api/v1/profile',
          },
          documentation: '/api/v1/docs',
          deprecated: false,
          sunset: null,
        };
      });
    },
    { prefix: '/api/v1' }
  );

  // Default version redirect (no version specified)
  fastify.get('/api', async (_request: any, reply: any) => {
    return reply.redirect('/api/v1');
  });

  // API version info endpoint
  fastify.get('/api/versions', async (_request: any, _reply: any) => {
    return {
      current: API_VERSIONS.CURRENT,
      supported: API_VERSIONS.SUPPORTED,
      deprecated: API_VERSIONS.DEPRECATED,
      versions: {
        v1: {
          status: 'stable',
          released: '2025-07-06',
          documentation: '/api/v1/docs',
          breaking_changes: [],
        },
      },
    };
  });
}

// Middleware to add version headers
export function addVersionHeaders(fastify: any) {
  fastify.addHook('onSend', async (request: any, reply: any) => {
    // Extract version from URL
    const versionMatch = request.url.match(/\/api\/(v\d+)/);
    const version = versionMatch ? versionMatch[1] : API_VERSIONS.CURRENT;

    reply.header('X-API-Version', version);
    reply.header('X-API-Current', API_VERSIONS.CURRENT);
    reply.header('X-API-Supported', API_VERSIONS.SUPPORTED.join(', '));

    if (version && API_VERSIONS.DEPRECATED.includes(version)) {
      reply.header('X-API-Deprecated', 'true');
      reply.header('X-API-Sunset', 'See documentation for sunset date');
    }
  });
}
