import winston from 'winston';

// Create the logger
const logger = winston.createLogger({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Helper functions for structured logging
export const loggers = {
  database: {
    connected: (details: Record<string, unknown>) =>
      logger.info('Database connected', details),
    disconnected: (details: Record<string, unknown>) =>
      logger.info('Database disconnected', details),
    error: (error: Error, operation: string) =>
      logger.error('Database error', { operation, error: error.message }),
  },
  auth: {
    login: (userId: string, email: string) =>
      logger.info('User login', { userId, email }),
    register: (userId: string, email: string) =>
      logger.info('User registration', { userId, email }),
    failed: (email: string, reason: string) =>
      logger.warn('Authentication failed', { email, reason }),
  },
  weather: {
    request: (city: string, userId: string) =>
      logger.info('Weather request', { city, userId }),
    error: (city: string, userId: string, error: Error) =>
      logger.error('Weather API error', { city, userId, error: error.message }),
  },
  system: {
    startup: (port: number, env: string) =>
      logger.info('Server started', { port, environment: env }),
    error: (error: Error, context?: string) =>
      logger.error('System error', { context, error: error.message }),
  },
};

export default logger;
