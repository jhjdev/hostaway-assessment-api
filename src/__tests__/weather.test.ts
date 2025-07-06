import { build } from '../helpers/app';
import { User } from '../models/User';
import { hashPassword } from '../utils/auth';

describe('Weather Routes', () => {
  const app = build();
  let authToken: string;

  beforeAll(async () => {
    await app.ready();

    // Create and verify a test user
    const hashedPassword = await hashPassword('TestPassword123');
    await User.create({
      email: 'weather@example.com',
      password: hashedPassword,
      firstName: 'Weather',
      lastName: 'User',
      isVerified: true,
      preferences: {
        temperatureUnit: 'celsius',
        theme: 'system',
        notifications: true,
      },
    });

    // Get auth token
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'weather@example.com',
        password: 'TestPassword123',
      },
    });

    const loginBody = JSON.parse(loginResponse.body);
    authToken = loginBody.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/weather/health', () => {
    it('should return healthy status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/weather/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('healthy');
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/weather/current', () => {
    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/weather/current?city=London',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should require city parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/weather/current',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate city parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/weather/current?city=',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    // Note: This test would require mocking the OpenWeather API
    // For now, we'll skip it to avoid external API calls in tests
    it.skip('should return weather data for valid city', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/weather/current?city=London',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.location).toBeDefined();
      expect(body.data.temperature).toBeDefined();
    });
  });

  describe('GET /api/weather/history', () => {
    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/weather/history',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return empty history for new user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/weather/history',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });
  });

  describe('DELETE /api/weather/history', () => {
    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/weather/history',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should clear search history', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/weather/history',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Search history cleared successfully');
    });
  });
});
