import { build } from '../helpers/app';
import { User } from '../models/User';
import { hashPassword } from '../utils/auth';

describe('Authentication Routes', () => {
  const app = build();

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('User registered successfully');
      expect(body.userId).toBeDefined();
      expect(body.verificationCode).toBeDefined();
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test2@example.com',
        password: 'weak',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'ValidPassword123',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'TestPassword123',
      };

      // First registration
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData,
      });

      // Second registration with same email
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create verified user for login tests
      const hashedPassword = await hashPassword('TestPassword123');
      await User.create({
        email: 'login@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        isVerified: true,
        preferences: {
          temperatureUnit: 'celsius',
          theme: 'system',
          notifications: true,
        },
      });
    });

    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'TestPassword123',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: loginData,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Login successful');
      expect(body.token).toBeDefined();
      expect(body.user.email).toBe('login@example.com');
    });

    it('should reject login with incorrect password', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'WrongPassword123',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: loginData,
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: loginData,
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid credentials');
    });

    it('should reject login for unverified user', async () => {
      // Create unverified user
      const hashedPassword = await hashPassword('TestPassword123');
      await User.create({
        email: 'unverified@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        isVerified: false,
        preferences: {
          temperatureUnit: 'celsius',
          theme: 'system',
          notifications: true,
        },
      });

      const loginData = {
        email: 'unverified@example.com',
        password: 'TestPassword123',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: loginData,
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Please verify your email first');
    });
  });
});
