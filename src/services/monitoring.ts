/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyRequest, FastifyReply } from 'fastify';
import promClient from 'prom-client';

// Create a Registry which registers the metrics
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

const databaseConnections = new promClient.Gauge({
  name: 'database_connections',
  help: 'Number of database connections',
  labelNames: ['state'],
});

const weatherApiRequests = new promClient.Counter({
  name: 'weather_api_requests_total',
  help: 'Total number of weather API requests',
  labelNames: ['status', 'city'],
});

const userRegistrations = new promClient.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
});

const userLogins = new promClient.Counter({
  name: 'user_logins_total',
  help: 'Total number of user logins',
  labelNames: ['status'],
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(databaseConnections);
register.registerMetric(weatherApiRequests);
register.registerMetric(userRegistrations);
register.registerMetric(userLogins);

// Metrics functions
export const metrics = {
  httpRequest: {
    duration: httpRequestDuration,
    total: httpRequestTotal,
  },
  connections: {
    active: activeConnections,
    database: databaseConnections,
  },
  weather: {
    requests: weatherApiRequests,
  },
  users: {
    registrations: userRegistrations,
    logins: userLogins,
  },
};

// Setup monitoring middleware
export async function setupMonitoring(fastify: any) {
  // Add request timing middleware
  fastify.addHook(
    'onRequest',
    async (request: FastifyRequest, _reply: FastifyReply) => {
      request.startTime = process.hrtime();
    }
  );

  fastify.addHook(
    'onResponse',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (request.startTime) {
        const duration = process.hrtime(request.startTime);
        const durationInSeconds = duration[0] + duration[1] / 1e9;

        const route =
          (request as FastifyRequest & { routerPath?: string }).routerPath ||
          request.url;
        const method = request.method;
        const statusCode = reply.statusCode.toString();

        httpRequestDuration.observe(
          { method, route, status_code: statusCode },
          durationInSeconds
        );

        httpRequestTotal.inc({ method, route, status_code: statusCode });
      }
    }
  );

  // Metrics endpoint
  fastify.get('/metrics', async (_request: any, reply: any) => {
    reply.type('text/plain; version=0.0.4; charset=utf-8');
    return register.metrics();
  });

  // Health metrics endpoint
  fastify.get('/api/metrics/health', async (_request: any, _reply: any) => {
    return {
      metrics: {
        total_requests: await register.getSingleMetricAsString(
          'http_requests_total'
        ),
        active_connections:
          await register.getSingleMetricAsString('active_connections'),
        database_connections: await register.getSingleMetricAsString(
          'database_connections'
        ),
      },
      timestamp: new Date().toISOString(),
    };
  });
}

// Export register for external use
export { register };

// Declare module augmentation for request.startTime
declare module 'fastify' {
  interface FastifyRequest {
    startTime?: [number, number];
  }
}
